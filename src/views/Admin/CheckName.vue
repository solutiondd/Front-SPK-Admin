<template>
    <div class="max-[570px]:pt-16">
        <div class="w-full bg-white rounded-lg shadow-sm p-6">
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">เช็คชื่อนักเรียน</h2>

                <!-- Filter Date -->
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 sm:items-end lg:grid-cols-3">
                    <div class="w-full sm:col-span-2 lg:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                        <input v-model="selectedDate" type="date" class="input input-bordered w-full"
                            @change="loadStudents" />
                    </div>
                    <div class="w-full">
                        <label class="block text-sm font-medium text-gray-700 mb-2">ชั้นเรียน</label>
                        <select v-model="selectedGrade" class="select select-bordered w-full"
                            @change="handleGradeChange">
                            <option value="">เลือกชั้นเรียน</option>
                            <option v-for="grade in gradeList" :key="grade" :value="grade">
                                {{ grade }}
                            </option>
                        </select>
                    </div>
                    <div class="w-full">
                        <label class="block text-sm font-medium text-gray-700 mb-2">ห้องเรียน</label>
                        <select v-model="selectedClassroom" class="select select-bordered w-full"
                            @change="loadStudents">
                            <option value="">เลือกห้องเรียน</option>
                            <option v-for="classroom in filteredClassrooms" :key="classroom._id"
                                :value="classroom.classroom">
                                {{ classroom.classroom }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <CheckNameTable :students="students" :selectedDate="selectedDate" :selectedGrade="selectedGrade"
            :loading="loading" :attendanceData="attendanceData" :pendingLeaveApprovals="pendingLeaveApprovals"
            @update:attendanceData="attendanceData = $event"
            @update:pendingLeaveApprovals="pendingLeaveApprovals = $event" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { StudentService } from '../../api/student';
import { ClassRoomService } from '../../api/class-room';
import reportApi from '../../api/report';
import { LeaveService } from '../../api/leave';
import CheckNameTable from '../../components/CheckName/Table.vue';
import Swal from 'sweetalert2';

const studentService = new StudentService();
const classRoomService = new ClassRoomService();
const leaveService = new LeaveService();

const students = ref([]);
const classrooms = ref([]);
const loading = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const selectedGrade = ref('');
const selectedClassroom = ref('');
const attendanceData = ref({});
const pendingLeaveApprovals = ref({});

const approvedLeaveStatuses = new Set(['approved']);
const pendingLeaveStatuses = new Set(['pending']);
const leaveStatusPriority = {
    approved: 2,
    pending: 1,
};

const gradeList = computed(() => {
    const grades = new Set(classrooms.value.map(c => c.grade));
    return Array.from(grades).sort((a, b) => {
        const numA = parseInt(a.split('.')[1]);
        const numB = parseInt(b.split('.')[1]);
        return numA - numB;
    });
});

const filteredClassrooms = computed(() => {
    if (!selectedGrade.value) return [];
    return classrooms.value.filter(c => c.grade === selectedGrade.value);
});

const loadClassrooms = async () => {
    try {
        const response = await classRoomService.getClassRooms();
        classrooms.value = response.data || [];
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายชื่อห้องเรียนได้', 'error');
        console.error('Load classrooms error:', error);
    }
};

const handleGradeChange = () => {
    selectedClassroom.value = '';
    loadStudents();
};

const hasAttendanceOnDate = (student, date) => {
    const attendances = student?.attendances || [];
    return attendances.some((attendance) => {
        if (attendance?.date !== date) {
            return false;
        }

        return Array.isArray(attendance?.timeStamps) && attendance.timeStamps.length > 0;
    });
};

const getLeaveStudentKeys = (leaveRequest) => {
    const user = leaveRequest?.user_id;
    return [user?._id, user?.userid, user].filter(Boolean).map((value) => String(value));
};

const mapDailyStatus = async (studentList) => {
    if (!selectedDate.value || !selectedGrade.value || !selectedClassroom.value) {
        attendanceData.value = {};
        pendingLeaveApprovals.value = {};
        return;
    }

    const studentKeys = new Set();
    studentList.forEach((student) => {
        [student?._id, student?.userid, student?.id].filter(Boolean).forEach((value) => {
            studentKeys.add(String(value));
        });
    });

    const [attendanceResponse, leaveResponse] = await Promise.all([
        reportApi.getAttendanceReport({
            start: selectedDate.value,
            end: selectedDate.value,
            role: 'student',
            name: '',
            department: '',
            userid: '',
            grade: selectedGrade.value,
            classroom: selectedClassroom.value,
            page: 1,
            limit: 50,
        }),
        leaveService.getLeaveRequests({
            start_date: selectedDate.value,
            end_date: selectedDate.value,
            status: '',
            user_id: '',
        }),
    ]);

    const attendanceRows = attendanceResponse?.data || [];
    const leaveRows = leaveResponse?.data || [];
    const presentKeys = new Set();
    const leaveByStudentKey = new Map();

    attendanceRows.forEach((student) => {
        if (!hasAttendanceOnDate(student, selectedDate.value)) {
            return;
        }

        const attendanceKeys = [student?._id, student?.userid, student?.id]
            .filter(Boolean)
            .map((value) => String(value));

        if (!attendanceKeys.some((key) => studentKeys.has(key))) {
            return;
        }

        attendanceKeys.forEach((key) => {
            presentKeys.add(key);
        });
    });

    leaveRows.forEach((leaveRequest) => {
        const status = String(leaveRequest?.status || '').toLowerCase();
        if (!approvedLeaveStatuses.has(status) && !pendingLeaveStatuses.has(status)) {
            return;
        }

        if (leaveRequest?.start_date !== selectedDate.value) {
            return;
        }

        getLeaveStudentKeys(leaveRequest).forEach((key) => {
            const currentLeave = leaveByStudentKey.get(key);
            const currentPriority = leaveStatusPriority[String(currentLeave?.status || '').toLowerCase()] || 0;
            const nextPriority = leaveStatusPriority[status] || 0;

            if (!currentLeave || nextPriority >= currentPriority) {
                leaveByStudentKey.set(key, leaveRequest);
            }
        });
    });

    const nextAttendanceData = {};
    const nextPendingLeaveApprovals = {};

    studentList.forEach((student) => {
        const keys = [student?._id, student?.userid, student?.id].filter(Boolean).map((value) => String(value));
        const isPresent = keys.some((key) => presentKeys.has(key));

        if (isPresent) {
            nextAttendanceData[student._id] = {
                status: 'present',
                leaveType: null,
                remark: '',
            };
            return;
        }

        const leaveRequest = keys.map((key) => leaveByStudentKey.get(key)).find(Boolean);
        if (!leaveRequest) {
            return;
        }

        const leaveStatus = String(leaveRequest?.status || '').toLowerCase();
        const leaveTypeName = leaveRequest?.leave_type_id?.name || 'ลา';
        const reason = leaveRequest?.reason || '';

        nextAttendanceData[student._id] = {
            status: 'leave',
            leaveType: leaveTypeName,
            remark: reason,
            leaveRequestId: leaveRequest?._id || null,
            leaveStatus,
        };

        if (pendingLeaveStatuses.has(leaveStatus)) {
            nextPendingLeaveApprovals[student._id] = {
                requestId: leaveRequest?._id || null,
                leaveType: leaveTypeName,
                reason,
            };
        }
    });

    attendanceData.value = nextAttendanceData;
    pendingLeaveApprovals.value = nextPendingLeaveApprovals;
};

const loadStudents = async () => {
    if (!selectedClassroom.value) {
        students.value = [];
        attendanceData.value = {};
        pendingLeaveApprovals.value = {};
        return;
    }

    loading.value = true;
    try {
        const response = await studentService.getStudents(selectedGrade.value, selectedClassroom.value);
        const studentList = response.data || [];
        students.value = studentList;
        await mapDailyStatus(studentList);
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายชื่อนักเรียนได้', 'error');
        console.error('Load students error:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    selectedDate.value = new Date().toISOString().split('T')[0];
    loadClassrooms();
});
</script>
