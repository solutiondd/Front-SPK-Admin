<template>
    <dialog ref="modalRef" class="modal">
        <div class="modal-box w-11/12 max-w-3xl">
            <div class="flex items-start justify-between gap-4 mb-5">
                <div>
                    <h3 class="font-bold text-lg">รายละเอียดใบลา</h3>
                    <p class="text-xs text-base-content/60">ข้อมูลการลาและสถานะการอนุมัติ</p>
                </div>
                <div v-if="request" :class="['badge', getStatusBadgeClass(request.status)]">
                    {{ formatStatus(request.status) }}
                </div>
            </div>

            <div v-if="request" class="text-sm">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div class="rounded-lg border border-base-300 p-4">
                        <h4 class="font-semibold mb-3 text-base">ข้อมูลผู้ลา</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-base-content/70">รหัส</span>
                                <span class="font-semibold">{{ request.user_id?.userid || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/70">ชื่อ</span>
                                <span class="font-semibold">{{ request.user_id?.name || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/70">ตำแหน่ง</span>
                                <span class="font-semibold">{{ formatRole(request.user_id?.role) }}</span>
                            </div>
                            <div v-if="formatStudentLevel(request.user_id?.grade, request.user_id?.classroom)"
                                class="flex justify-between">
                                <span class="text-base-content/70">ชั้น</span>
                                <span class="font-semibold">{{ formatStudentLevel(request.user_id?.grade,
                                    request.user_id?.classroom) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-lg border border-base-300 p-4">
                        <h4 class="font-semibold mb-3 text-base">รายละเอียดการลา</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-base-content/70">รายการ</span>
                                <span class="font-semibold">{{ request.leave_type_id?.name || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/70">เหตุผล</span>
                                <span class="font-semibold text-right break-words">{{ request.reason || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/70">ช่วงการลา</span>
                                <span class="font-semibold">{{ formatDateRange(request.start_date, request.end_date)
                                }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/70">เวลา</span>
                                <span class="font-semibold">{{ formatTimeRange(request.start_time, request.end_time)
                                }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div class="rounded-lg border border-base-300 p-4">
                        <h4 class="font-semibold mb-3 text-base">อนุมัติโดย</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-base-content/70">ชื่อ</span>
                                <span class="font-semibold">{{ request.approved_by?.name || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/70">ตำแหน่ง</span>
                                <span class="font-semibold">{{ formatRole(request.approved_by?.role) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/70">อนุมัติวันเวลา</span>
                                <span class="font-semibold">{{ formatDate(request.approved_at) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-lg border border-base-300 p-4">
                        <h4 class="font-semibold mb-3 text-base">ผู้ขอลา</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-base-content/70">ชื่อ</span>
                                <span class="font-semibold">{{ request.created_by?.name || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/70">ตำแหน่ง</span>
                                <span class="font-semibold">{{ formatRole(request.created_by?.role) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-action">
                <button class="btn" @click="closeModal">ปิด</button>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
</template>

<script setup>
import { ref } from 'vue';

const modalRef = ref(null);
const request = ref(null);

const formatRole = (role) => {
    if (role === 'student') return 'นักเรียน';
    if (role === 'teacher') return 'ครู';
    return role || '-';
};

const formatStatus = (status) => {
    if (!status) return '-';
    if (status === 'approved') return 'อนุมัติแล้ว';
    if (status === 'pending') return 'รอดำเนินการ';
    if (status === 'rejected') return 'ไม่อนุมัติ';
    if (status === 'cancelled') return 'ยกเลิก';
    return status;
};

const getStatusBadgeClass = (status) => {
    if (status === 'approved') return 'badge-success text-success-content';
    if (status === 'pending') return 'badge-warning text-warning-content';
    if (status === 'rejected') return 'badge-error text-error-content';
    if (status === 'cancelled') return 'badge-neutral text-neutral-content';
    return 'badge-outline';
};

const formatStudentLevel = (grade, classroom) => {
    if (!grade && !classroom) return null;
    if (grade && classroom) return `${grade}/${classroom}`;
    return grade || classroom;
};

const formatTime = (time) => {
    if (!time) return '-';
    return time;
};

const formatTimeRange = (startTime, endTime) => {
    if (!startTime && !endTime) return '-';
    if (startTime && endTime) return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    return formatTime(startTime) || formatTime(endTime);
};

const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(d);
};

const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return '-';
    if (startDate === endDate) return formatDate(startDate);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

const openModal = (data) => {
    request.value = data;
    modalRef.value?.showModal();
};

const closeModal = () => {
    modalRef.value?.close();
};

defineExpose({ openModal });
</script>
