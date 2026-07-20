<template>
    <div class="w-full">
        <div class="flex justify-end mb-2" v-if="!hideExport">
            <button class="btn btn-sm btn-success" :disabled="loadingExport" @click="exportLeaveToExcel">
                <span v-if="loadingExport" class="loading loading-spinner loading-xs mr-2"></span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                ส่งออก Excel
            </button>
        </div>

        <div v-if="loading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
            <table class="table table-zebra w-full text-sm">
                <thead>
                    <tr class="bg-primary text-primary-content">
                        <th>รหัส</th>
                        <th>ชื่อ</th>
                        <th class="hidden xl:table-cell">ตำแหน่ง</th>
                        <th class="hidden md:table-cell">วันที่ลา</th>
                        <th>สถานะ</th>
                        <th class="text-center"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="request in leaveRequests" :key="request._id">
                        <td>{{ request.user_id?.userid || '-' }}</td>
                        <td>{{ request.user_id?.name || '-' }}</td>
                        <td class="hidden xl:table-cell">{{ formatRole(request.user_id?.role) }}</td>
                        <td class="hidden md:table-cell">{{ formatDate(request.start_date) }}</td>
                        <td>
                            <div :class="['badge', getStatusBadgeClass(request.status), 'w-3 h-3 p-0 md:w-auto md:h-auto md:px-3']"
                                :title="formatStatus(request.status)">
                                <span class="hidden md:inline">{{ formatStatus(request.status) }}</span>
                            </div>
                        </td>
                        <td class="text-center">
                            <button @click="openDetail(request)" class="bg-transparent border-none shadow-none p-0"
                                title="ดูข้อมูลเพิ่มเติม">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                    stroke="#3b82f6">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="!leaveRequests.length">
                        <td colspan="6" class="text-center text-gray-500 py-6">ไม่พบข้อมูลใบลา</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <LeaveReqDetail ref="leaveReqDetailRef" />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { LeaveService } from '../../api/leave';
import LeaveReqDetail from './LeaveReqDetail.vue';

const props = defineProps({
    filters: {
        type: Object,
        default: () => ({
            start_date: '',
            end_date: '',
            search: '',
            status: 'approved',
            role: '',
        }),
    },
    hideExport: {
        type: Boolean,
        default: false,
    },
});

const leaveService = new LeaveService();
const loading = ref(false);
const loadingExport = ref(false);
const leaveRequests = ref([]);
const leaveReqDetailRef = ref(null);

const residentRole = localStorage.getItem('residentRole') || '';
const teacherGrade = localStorage.getItem('grade') || '';
const teacherClassroom = localStorage.getItem('classroom') || '';

const formatRole = (role) => {
    if (role === 'student') return 'นักเรียน';
    if (role === 'teacher') return 'ครู';
    return role || '-';
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

const openDetail = (request) => {
    leaveReqDetailRef.value?.openModal(request);
};

const getLeaveTypeLabel = (leaveType) => {
    const typeName =
        (typeof leaveType === 'object' ? leaveType?.name : leaveType) ||
        '';

    if (!typeName) return '-';
    if (typeName === 'sick') return 'ลาป่วย';
    if (typeName === 'personal') return 'ลากิจ';
    if (typeName === 'vacation') return 'ลาพักร้อน';
    return typeName;
};

const exportLeaveToExcel = async () => {
    if (loadingExport.value) return;
    loadingExport.value = true;

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('LeaveRequests');

        let reportRange = '';
        if (props.filters?.start_date && props.filters?.end_date) {
            reportRange = `(${formatDate(props.filters.start_date)} - ${formatDate(props.filters.end_date)})`;
        }

        worksheet.addRow([`รายงานใบลา ${reportRange}`]);
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getCell('A1').font = { bold: true };

        const headers = [
            'ลำดับ',
            'รหัส',
            'ชื่อ',
            'ตำแหน่ง',
            'ประเภทการลา',
            'วันที่ลา',
            'สถานะ',
            'เหตุผล',
        ];

        worksheet.addRow(headers);

        leaveRequests.value.forEach((item, index) => {
            worksheet.addRow([
                index + 1,
                item.user_id?.userid || '-',
                item.user_id?.name || '-',
                formatRole(item.user_id?.role),
                getLeaveTypeLabel(item.leave_type_id || item.leave_type || item.type),
                formatDate(item.start_date),
                formatStatus(item.status),
                item.reason || '-',
            ]);
        });

        worksheet.columns = [
            { width: 10 },
            { width: 16 },
            { width: 24 },
            { width: 14 },
            { width: 18 },
            { width: 18 },
            { width: 16 },
            { width: 48 },
        ];

        worksheet.getRow(2).font = { bold: true };
        worksheet.getRow(2).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getColumn(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getColumn(2).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getColumn(5).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getColumn(6).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getColumn(7).alignment = { horizontal: 'center', vertical: 'middle' };

        const safeStart = props.filters?.start_date || '';
        const safeEnd = props.filters?.end_date || '';
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `LeaveRequests_${safeStart}_${safeEnd}.xlsx`);
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการส่งออก Excel');
        console.error('Error exporting leave requests:', error);
    } finally {
        loadingExport.value = false;
    }
};

const loadLeaveRequests = async () => {
    loading.value = true;
    try {
        let filters = {
            start_date: props.filters.start_date || '',
            end_date: props.filters.end_date || '',
            status: props.filters.status ?? '',
        };

        if (residentRole === 'teacher' && teacherGrade && teacherClassroom) {
            filters.grade = teacherGrade;
            filters.classroom = teacherClassroom;
        }

        const response = await leaveService.getLeaveRequests(filters);

        let data = response.data || response;
        if (props.filters.role) {
            data = data.filter((item) => item.user_id?.role === props.filters.role);
        }

        if (props.filters.search) {
            const search = props.filters.search.toLowerCase();
            data = data.filter(
                (item) =>
                    item.user_id?.name?.toLowerCase().includes(search) ||
                    item.user_id?.userid?.toLowerCase().includes(search)
            );
        }

        if (residentRole === 'teacher' && teacherGrade && teacherClassroom) {
            data = data.filter(
                (item) =>
                    item.user_id?.grade === teacherGrade &&
                    item.user_id?.classroom === teacherClassroom
            );
        }

        leaveRequests.value = data;
    } catch (error) {
        console.error('Error loading leave requests:', error);
        leaveRequests.value = [];
    } finally {
        loading.value = false;
    }
};

watch(() => props.filters, loadLeaveRequests, { deep: true });

loadLeaveRequests();
</script>
