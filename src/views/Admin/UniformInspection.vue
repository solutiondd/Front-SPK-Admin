<template>
    <div class="max-[944px]:pt-16">
        <div class="w-full bg-white rounded-lg shadow-sm p-6">
            <div class="mb-6">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">เช็คระเบียบการแต่งตัว</h2>
                    <div class="flex items-center gap-2">
                        <label class="text-sm font-medium text-gray-700 whitespace-nowrap">วันที่</label>
                        <input v-model="selectedDate" type="date" class="input input-bordered input-sm"
                            @change="loadUsers" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 gap-y-3 items-end lg:grid-cols-4 lg:gap-4">
                    <div class="w-full">
                        <label class="block text-sm font-medium text-gray-700 mb-2">ค้นหาชื่อ/รหัส</label>
                        <input v-model="searchQuery" type="text" class="input input-bordered w-full"
                            placeholder="ชื่อหรือรหัส..." @input="handleSearch" />
                    </div>

                    <div v-if="residentRole !== 'teacher'" class="w-full">
                        <label class="block text-sm font-medium text-gray-700 mb-2">ชั้นเรียน</label>
                        <select v-model="selectedGrade" class="select select-bordered w-full"
                            @change="handleGradeChange">
                            <option value="">เลือกชั้นเรียน</option>
                            <option v-for="grade in gradeList" :key="grade" :value="grade">
                                {{ mapGradeDisplay(grade) }}
                            </option>
                        </select>
                    </div>

                    <div v-if="residentRole !== 'teacher'" class="w-full">
                        <label class="block text-sm font-medium text-gray-700 mb-2">ห้องเรียน</label>
                        <select v-model="selectedClassroom" class="select select-bordered w-full" @change="loadUsers">
                            <option value="">เลือกห้องเรียน</option>
                            <option v-for="classroom in filteredClassrooms" :key="classroom._id"
                                :value="classroom.classroom">
                                {{ classroom.classroom }}
                            </option>
                        </select>
                    </div>

                    <div v-if="residentRole === 'teacher'" class="w-full col-span-1 lg:col-start-4 flex justify-end">
                        <div class="p-2 text-white bg-primary rounded-md text-center min-w-[120px]">
                            <span class="block text-sm font-medium text-secondary">ชั้นปี / ห้อง</span>
                            <span>{{ mapGradeDisplay(teacherGrade) }}/{{ teacherClassroom }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <UniformInspectionTable :students="students" :selectedDate="selectedDate" :selectedGrade="selectedGrade"
                :selectedClassroom="selectedClassroom" :loading="loading" :saving="isSaving"
                :inspectionData="inspectionData" @update:inspectionData="inspectionData = $event"
                @save="saveWholeClassroomInspection" />
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { StudentService } from '../../api/student';
import { ClassRoomService } from '../../api/class-room';
import { UniformInspectionService } from '../../api/uniform_inspection';
import UniformInspectionTable from '../../components/Uniform Inspection/Table.vue';
import { mapGradeDisplay, toVisibleSortedGrades } from '../../utils/gradeSystem';

const studentService = new StudentService();
const classRoomService = new ClassRoomService();
const uniformInspectionService = new UniformInspectionService();

const residentRole = localStorage.getItem('residentRole') || '';
const teacherGrade = localStorage.getItem('grade') || '';
const teacherClassroom = localStorage.getItem('classroom') || '';

const students = ref([]);
const allStudents = ref([]);
const classrooms = ref([]);
const loading = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const selectedGrade = ref(residentRole === 'teacher' && teacherGrade ? teacherGrade : '');
const selectedClassroom = ref(residentRole === 'teacher' && teacherClassroom ? teacherClassroom : '');
const searchQuery = ref('');
const inspectionData = ref({});
const isSaving = ref(false);
let searchTimer = null;

const gradeList = computed(() => {
    return toVisibleSortedGrades(classrooms.value.map(c => c.grade));
});

const filteredClassrooms = computed(() => {
    if (!selectedGrade.value) return [];
    return classrooms.value.filter(c => c.grade === selectedGrade.value);
});

const loadClassrooms = async () => {
    try {
        const response = await classRoomService.getClassRooms();
        classrooms.value = response.data || [];

        if (residentRole !== 'teacher') {
            const grades = gradeList.value;
            if (!selectedGrade.value && grades.length > 0) {
                selectedGrade.value = grades[0];
            }

            if (!selectedClassroom.value && selectedGrade.value) {
                const firstClassroom = classrooms.value.find(c => c.grade === selectedGrade.value);
                if (firstClassroom) {
                    selectedClassroom.value = firstClassroom.classroom;
                }
            }
        }
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายชื่อห้องเรียนได้', 'error');
        console.error('Load classrooms error:', error);
    }
};

const loadUsers = async () => {
    if (residentRole === 'teacher') {
        selectedGrade.value = teacherGrade;
        selectedClassroom.value = teacherClassroom;
    }

    if (!selectedGrade.value || !selectedClassroom.value) {
        students.value = [];
        allStudents.value = [];
        inspectionData.value = {};
        return;
    }

    loading.value = true;
    try {
        const response = await studentService.getStudents(selectedGrade.value, selectedClassroom.value);
        const studentList = response.data || [];
        students.value = studentList;
        allStudents.value = studentList;
        inspectionData.value = {};
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายชื่อนักเรียนได้', 'error');
        console.error('Load students error:', error);
    } finally {
        loading.value = false;
    }
};

const handleGradeChange = () => {
    selectedClassroom.value = '';
    searchQuery.value = '';
    students.value = [];
    allStudents.value = [];
    inspectionData.value = {};
};

const handleSearch = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        const q = searchQuery.value.trim().toLowerCase();
        if (!q) {
            students.value = allStudents.value;
            return;
        }

        students.value = allStudents.value.filter((s) => {
            const name = [s.pre_name, s.first_name, s.last_name, s.name].filter(Boolean).join(' ').toLowerCase();
            const userid = String(s.userid || '').toLowerCase();
            return name.includes(q) || userid.includes(q);
        });
    }, 300);
};

const normalizeClassroom = (value) => {
    if (value === '' || value === null || value === undefined) return value;
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
};

const saveWholeClassroomInspection = async () => {
    if (!selectedDate.value || !selectedGrade.value || !selectedClassroom.value) {
        Swal.fire('แจ้งเตือน', 'กรุณาเลือกวันที่ ชั้นเรียน และห้องเรียนก่อนบันทึก', 'warning');
        return;
    }

    if (!allStudents.value.length) {
        Swal.fire('แจ้งเตือน', 'ไม่พบรายชื่อนักเรียนในห้องนี้', 'warning');
        return;
    }

    const unmarkedStudents = allStudents.value.filter((student) => {
        const status = inspectionData.value?.[student._id]?.ispass;
        return status !== true && status !== false;
    });

    if (unmarkedStudents.length > 0) {
        Swal.fire('แจ้งเตือน', `ยังเช็คไม่ครบ ${unmarkedStudents.length} คน กรุณาเช็คให้ครบก่อนบันทึก`, 'warning');
        return;
    }

    const studentsPayload = allStudents.value.map((student) => {
        const entry = inspectionData.value?.[student._id] || {};
        return {
            student_id: student._id,
            ispass: entry.ispass === true,
            ...(entry.ispass === false
                ? {
                    issues: Array.isArray(entry.issues) ? entry.issues : [],
                    remark: entry.remark || '',
                }
                : {}),
        };
    });

    isSaving.value = true;
    try {
        await uniformInspectionService.createUniformInspection({
            date: selectedDate.value,
            grade: selectedGrade.value,
            classroom: normalizeClassroom(selectedClassroom.value),
            students: studentsPayload,
        });
        Swal.fire('สำเร็จ', 'บันทึกเช็คระเบียบทั้งห้องเรียบร้อยแล้ว', 'success');

        inspectionData.value = {};
    } catch (error) {
        console.error('Save whole classroom inspection error:', error);
        Swal.fire('เกิดข้อผิดพลาด', 'บันทึกเช็คระเบียบทั้งห้องไม่สำเร็จ', 'error');
    } finally {
        isSaving.value = false;
    }
};

onMounted(async () => {
    await loadClassrooms();
    await loadUsers();
});
</script>
