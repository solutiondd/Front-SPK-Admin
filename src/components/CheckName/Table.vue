<template>
    <div class="w-full">
        <div v-if="loading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else>
            <table class="table table-zebra w-full text-xs sm:text-[10px] xl:text-sm">
                <thead>
                    <tr class="bg-gray-100">
                        <th>รหัส</th>
                        <th>ชื่อ</th>
                        <th class="w-40">สถานะ</th>
                        <th class="w-48 max-[444px]:hidden">หมายเหตุ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="student in students" :key="student._id" class="hover">
                        <td class="text-xs sm:text-[10px] xl:text-sm">{{ student.userid }}</td>
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="font-semibold text-xs sm:text-[10px] xl:text-sm">
                                    {{ student.name || [student.pre_name, student.first_name,
                                    student.last_name].filter(Boolean).join(' ') }}
                                </div>
                            </div>
                        </td>
                        <td>
                            <div v-if="localPendingLeaveApprovals[student._id]" class="dropdown dropdown-end">
                                <button
                                    class="btn btn-sm btn-ghost w-full justify-between border-0 shadow-none bg-transparent hover:bg-base-200">
                                    <span class="badge badge-warning gap-2">
                                        <!-- <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 3c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z">
                                            </path>
                                        </svg> -->
                                        รออนุมัติ
                                    </span>
                                    <!-- <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7"></path>
                                    </svg> -->
                                </button>
                                <ul class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                    <li>
                                        <button type="button" :disabled="autoSaving"
                                            @click.stop.prevent="approveLeave(student._id)">
                                            <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            อนุญาต
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" :disabled="autoSaving"
                                            @click.stop.prevent="rejectLeave(student._id)">
                                            <svg class="w-4 h-4 text-error" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                            ไม่อนุญาต
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" :disabled="autoSaving"
                                            @click.stop.prevent="cancelLeave(student._id)">
                                            <svg class="w-4 h-4 text-warning" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                            ยกเลิก
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" :disabled="autoSaving"
                                            @click.stop.prevent="editLeave(student._id)">
                                            <svg class="w-4 h-4 text-info" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.41-9.41a2 2 0 112.82 2.82L11 16l-4 1 1-4 9.59-9.59z">
                                                </path>
                                            </svg>
                                            แก้ไข
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <span v-else-if="localAttendanceData[student._id]?.status === 'present'"
                                class="badge badge-success gap-2">
                                <!-- <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg> -->
                                มา
                            </span>
                            <span v-else-if="localAttendanceData[student._id]?.status === 'leave'"
                                class="badge badge-warning">
                                ลา
                            </span>
                            <div v-else class="dropdown dropdown-end">
                                <button
                                    class="btn btn-sm btn-ghost w-full justify-between border-0 shadow-none bg-transparent hover:bg-base-200">
                                    <span v-if="localAttendanceData[student._id]?.status === 'absent'"
                                        class="badge badge-error gap-2">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                        ขาด
                                    </span>
                                    <span v-else class="badge badge-ghost">
                                        ว่าง
                                    </span>
                                    <!-- <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7"></path>
                                    </svg> -->
                                </button>
                                <ul class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                    <li>
                                        <button type="button" @click.stop.prevent="markPresent(student._id)">
                                            <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            มาเรียน
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" @click.stop.prevent="openLeaveModal(student._id)">
                                            <svg class="w-4 h-4 text-warning" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            ลา
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" @click.stop.prevent="markAbsent(student._id)">
                                            <svg class="w-4 h-4 text-error" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                            ขาด
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </td>
                        <td class="text-xs sm:text-[10px] xl:text-sm max-[444px]:hidden">
                            <div v-if="localAttendanceData[student._id]?.status === 'leave'" class="text-warning">
                                <span class="font-medium">{{ localAttendanceData[student._id]?.leaveType }}</span>
                                <div v-if="localAttendanceData[student._id]?.remark"
                                    class="text-xs sm:text-[10px] xl:text-sm text-base-content mt-1">
                                    {{ localAttendanceData[student._id]?.remark }}
                                </div>
                                <!-- <div v-if="localPendingLeaveApprovals[student._id]" class="text-xs mt-1">
                                    <span class="text-error">รอการอนุมัติ</span>
                                </div> -->
                            </div>
                            <div v-else-if="localAttendanceData[student._id]?.remark">
                                {{ localAttendanceData[student._id]?.remark }}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <dialog v-if="leaveModal.show" class="modal modal-open">
            <div class="modal-box w-11/12 max-w-md">
                <h3 class="font-bold text-lg mb-4">บันทึกการลา</h3>

                <div class="form-control w-full mb-4">
                    <label class="label">
                        <span class="label-text">ประเภทการลา</span>
                    </label>
                    <select v-model="leaveModal.form.leaveType" class="select select-bordered">
                        <option value="sick">ลาป่วย</option>
                        <option value="personal">ลากิจส่วนตัว</option>
                        <option value="other">ลาอื่น ๆ</option>
                    </select>
                </div>

                <p class="text-sm text-gray-500 mb-4">บันทึกการลาสำหรับวันที่ {{ formatThaiDate(selectedDate) }}</p>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text">เวลาเริ่ม <span class="text-gray-400 text-xs">(ไม่เลือก =
                                    เต็มวัน)</span></span>
                        </label>
                        <input type="time" v-model="leaveModal.form.startTime" class="input input-bordered" />
                    </div>
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text">เวลาสิ้นสุด <span class="text-gray-400 text-xs">(ไม่เลือก =
                                    เต็มวัน)</span></span>
                        </label>
                        <input type="time" v-model="leaveModal.form.endTime" class="input input-bordered" />
                    </div>
                </div>

                <div class="form-control w-full mb-4">
                    <label class="label">
                        <span class="label-text">รายละเอียด</span>
                    </label>
                    <textarea v-model="leaveModal.form.reason" class="textarea textarea-bordered"
                        placeholder="กรอกรายละเอียดการลา" rows="3"></textarea>
                </div>

                <div class="modal-action">
                    <button class="btn" @click="closeLeaveModal">ยกเลิก</button>
                    <button class="btn btn-primary" :disabled="autoSaving" @click="createLeaveRequest">
                        {{ leaveModal.mode === 'edit' ? 'บันทึกการแก้ไข' : 'ยืนยัน' }}
                    </button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop" @click="closeLeaveModal">
                <button>close</button>
            </form>
        </dialog>
    </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { LeaveService } from '../../api/leave';
import Swal from 'sweetalert2';

const leaveService = new LeaveService();

const props = defineProps({
    students: Array,
    selectedDate: String,
    selectedGrade: String,
    loading: Boolean,
    attendanceData: Object,
    pendingLeaveApprovals: Object,
});

const emit = defineEmits(['update:attendanceData', 'update:pendingLeaveApprovals']);

const imgBaseUrl = ref(import.meta.env.VITE_APP_IMG_URL);
const autoSaving = ref(false);
const localAttendanceData = ref({});
const localPendingLeaveApprovals = ref({});
const leaveTypeIdMap = ref({
    sick: '',
    personal: '',
    other: '',
});

const leaveModal = ref({
    show: false,
    mode: 'create',
    requestId: null,
    studentId: null,
    form: {
        leaveType: '',
        startTime: '',
        endTime: '',
        reason: '',
    },
});

watch(() => props.attendanceData, (newVal) => {
    localAttendanceData.value = { ...newVal };
}, { deep: true });

watch(() => props.pendingLeaveApprovals, (newVal) => {
    localPendingLeaveApprovals.value = { ...newVal };
}, { deep: true });

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
};

const toTimeNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
};

const getLeaveTypeLabel = (leaveType) => {
    if (leaveType === 'sick') return 'ลาป่วย';
    if (leaveType === 'personal') return 'ลากิจส่วนตัว';
    return 'ลาอื่น ๆ';
};

const getLeaveTypeKeyFromLabel = (label) => {
    const text = String(label || '').trim();
    if (text === 'ลาป่วย') return 'sick';
    if (text === 'ลากิจส่วนตัว') return 'personal';
    if (text === 'ลาอื่น ๆ') return 'other';
    return 'other';
};

const loadLeaveTypes = async () => {
    try {
        const response = await leaveService.getLeaveTypes();
        const leaveTypes = response?.data || [];
        const map = { sick: '', personal: '', other: '' };

        leaveTypes.forEach((item) => {
            const name = String(item?.name || '').toLowerCase();
            if (!map.sick && (name.includes('sick') || name.includes('ป่วย'))) {
                map.sick = item._id;
                return;
            }
            if (!map.personal && (name.includes('personal') || name.includes('กิจ'))) {
                map.personal = item._id;
                return;
            }
            if (!map.other) {
                map.other = item._id;
            }
        });

        leaveTypeIdMap.value = map;
    } catch (error) {
        console.error('Load leave types error:', error);
    }
};

const markPresent = async (studentId) => {
    if (autoSaving.value) return;
    localAttendanceData.value[studentId] = {
        status: 'present',
        leaveType: null,
        remark: '',
    };
    emit('update:attendanceData', localAttendanceData.value);

    if (!props.selectedDate) {
        Swal.fire('แจ้งเตือน', 'กรุณาเลือกวันที่ก่อน', 'warning');
        return;
    }

    autoSaving.value = true;
    try {
        await leaveService.manualAttendance({
            user_id: studentId,
            date: props.selectedDate,
            time: toTimeNow(),
            remark: '',
        });
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'บันทึกสถานะมาเรียนไม่สำเร็จ', 'error');
        console.error('Auto save present error:', error);
    } finally {
        autoSaving.value = false;
    }
};

const markAbsent = (studentId) => {
    if (autoSaving.value) return;
    localAttendanceData.value[studentId] = {
        status: 'absent',
        leaveType: null,
        remark: '',
    };
    emit('update:attendanceData', localAttendanceData.value);
};

const openLeaveModal = async (studentId, mode = 'create') => {
    const pending = localPendingLeaveApprovals.value[studentId] || {};
    const attendance = localAttendanceData.value[studentId] || {};

    const leaveType = mode === 'edit'
        ? (pending.leaveTypeKey || getLeaveTypeKeyFromLabel(pending.leaveType || attendance.leaveType))
        : 'sick';

    leaveModal.value.studentId = studentId;
    leaveModal.value.mode = mode;
    leaveModal.value.requestId = mode === 'edit' ? (pending.requestId || attendance.leaveRequestId || null) : null;
    leaveModal.value.form = {
        leaveType,
        startTime: mode === 'edit' ? (pending.startTime || '') : '',
        endTime: mode === 'edit' ? (pending.endTime || '') : '',
        reason: mode === 'edit' ? (pending.reason || attendance.remark || '') : '',
    };
    await nextTick();
    leaveModal.value.show = true;
};

const closeLeaveModal = () => {
    leaveModal.value.show = false;
    leaveModal.value.mode = 'create';
    leaveModal.value.requestId = null;
    leaveModal.value.studentId = null;
};

const editLeave = async (studentId) => {
    if (autoSaving.value) return;
    await openLeaveModal(studentId, 'edit');
};

const createLeaveRequest = async () => {
    if (autoSaving.value) return;
    if (!leaveModal.value.form.leaveType) {
        Swal.fire('แจ้งเตือน', 'กรุณาเลือกประเภทการลา', 'warning');
        return;
    }

    const studentId = leaveModal.value.studentId;
    const leaveType = leaveModal.value.form.leaveType;
    const reason = leaveModal.value.form.reason;

    if (!props.selectedDate) {
        Swal.fire('แจ้งเตือน', 'กรุณาเลือกวันที่ก่อน', 'warning');
        return;
    }

    const leaveTypeId = leaveTypeIdMap.value[leaveType];
    const leaveTypeName = getLeaveTypeLabel(leaveType);
    const startTime = leaveModal.value.form.startTime || '';
    const endTime = leaveModal.value.form.endTime || '';

    if (!leaveTypeId) {
        Swal.fire('แจ้งเตือน', 'ไม่พบประเภทลาในระบบ กรุณาตรวจสอบประเภทลา', 'warning');
        return;
    }

    autoSaving.value = true;
    try {
        const isEditMode = leaveModal.value.mode === 'edit';
        let leaveRequestId = leaveModal.value.requestId;
        let leaveStatus = 'pending';

        if (isEditMode && leaveRequestId) {
            await leaveService.updateLeaveRequest(leaveRequestId, {
                leave_type_id: leaveTypeId,
                start_date: props.selectedDate,
                end_date: props.selectedDate,
                start_time: startTime,
                end_time: endTime,
                reason,
                attachment_url: '',
            });
        } else {
            const response = await leaveService.createLeaveRequest({
                leave_type_id: leaveTypeId,
                user_id: studentId,
                start_date: props.selectedDate,
                end_date: props.selectedDate,
                start_time: startTime,
                end_time: endTime,
                reason,
                attachment_url: '',
            });
            leaveRequestId = response?.data?._id || response?._id || null;

            // Teacher-created leave from attendance screen should be approved immediately.
            if (leaveRequestId) {
                await leaveService.approveLeaveRequest(leaveRequestId, 'อนุมัติการลา');
                leaveStatus = 'approved';
            }
        }

        localAttendanceData.value[studentId] = {
            status: 'leave',
            leaveType: leaveTypeName,
            remark: reason,
            leaveRequestId,
            leaveStatus,
        };

        if (leaveStatus === 'pending') {
            localPendingLeaveApprovals.value[studentId] = {
                requestId: leaveRequestId,
                leaveTypeKey: leaveType,
                leaveType: leaveTypeName,
                startTime,
                endTime,
                reason,
            };
        } else {
            delete localPendingLeaveApprovals.value[studentId];
        }

        emit('update:attendanceData', localAttendanceData.value);
        emit('update:pendingLeaveApprovals', localPendingLeaveApprovals.value);
        closeLeaveModal();
        if (isEditMode) {
            Swal.fire('สำเร็จ', 'แก้ไขคำขอลาเรียบร้อยแล้ว', 'success');
        }
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', leaveModal.value.mode === 'edit' ? 'แก้ไขคำขอลาไม่สำเร็จ' : 'บันทึกการลาไม่สำเร็จ', 'error');
        console.error('Create leave request error:', error);
    } finally {
        autoSaving.value = false;
    }
};

const approveLeave = async (studentId) => {
    if (autoSaving.value) return;

    const pending = localPendingLeaveApprovals.value[studentId];
    if (!pending?.requestId) {
        Swal.fire('แจ้งเตือน', 'ไม่พบรายการลาที่ต้องอนุมัติ', 'warning');
        return;
    }

    autoSaving.value = true;
    try {
        await leaveService.approveLeaveRequest(pending.requestId, 'อนุมัติการลา');

        localAttendanceData.value[studentId] = {
            ...localAttendanceData.value[studentId],
            status: 'leave',
            leaveStatus: 'approved',
        };
        delete localPendingLeaveApprovals.value[studentId];
        emit('update:attendanceData', localAttendanceData.value);
        emit('update:pendingLeaveApprovals', localPendingLeaveApprovals.value);
        Swal.fire('สำเร็จ', 'อนุมัติการลาแล้ว', 'success');
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'บันทึกการอนุมัติลาไม่สำเร็จ', 'error');
        console.error('Approve leave error:', error);
    } finally {
        autoSaving.value = false;
    }
};

const rejectLeave = async (studentId) => {
    if (autoSaving.value) return;

    const pending = localPendingLeaveApprovals.value[studentId];
    if (!pending?.requestId) {
        delete localAttendanceData.value[studentId];
        delete localPendingLeaveApprovals.value[studentId];
        emit('update:attendanceData', localAttendanceData.value);
        emit('update:pendingLeaveApprovals', localPendingLeaveApprovals.value);
        Swal.fire('สำเร็จ', 'ไม่อนุมัติการลา', 'success');
        return;
    }

    autoSaving.value = true;
    try {
        await leaveService.rejectLeaveRequest(pending.requestId, 'ไม่อนุมัติการลา');
        delete localAttendanceData.value[studentId];
        delete localPendingLeaveApprovals.value[studentId];
        emit('update:attendanceData', localAttendanceData.value);
        emit('update:pendingLeaveApprovals', localPendingLeaveApprovals.value);
        Swal.fire('สำเร็จ', 'ไม่อนุมัติการลา', 'success');
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'บันทึกการไม่อนุมัติลาไม่สำเร็จ', 'error');
        console.error('Reject leave error:', error);
    } finally {
        autoSaving.value = false;
    }
};

const cancelLeave = async (studentId) => {
    if (autoSaving.value) return;

    const pending = localPendingLeaveApprovals.value[studentId];
    if (!pending?.requestId) {
        delete localAttendanceData.value[studentId];
        delete localPendingLeaveApprovals.value[studentId];
        emit('update:attendanceData', localAttendanceData.value);
        emit('update:pendingLeaveApprovals', localPendingLeaveApprovals.value);
        Swal.fire('สำเร็จ', 'ยกเลิกรายการลาแล้ว', 'success');
        return;
    }

    autoSaving.value = true;
    try {
        await leaveService.cancelLeaveRequest(pending.requestId);
        delete localAttendanceData.value[studentId];
        delete localPendingLeaveApprovals.value[studentId];
        emit('update:attendanceData', localAttendanceData.value);
        emit('update:pendingLeaveApprovals', localPendingLeaveApprovals.value);
        Swal.fire('สำเร็จ', 'ยกเลิกรายการลาแล้ว', 'success');
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ยกเลิกรายการลาไม่สำเร็จ', 'error');
        console.error('Cancel leave error:', error);
    } finally {
        autoSaving.value = false;
    }
};

onMounted(() => {
    loadLeaveTypes();
});
</script>