<template>
    <div class="w-full">
        <div v-if="loading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
            <table class="table table-zebra w-full text-sm">
                <thead>
                    <tr class="bg-primary text-primary-content">
                        <th>ชั้น</th>
                        <th>ห้อง</th>
                        <th class="max-[582px]:hidden">ผู้สร้าง</th>
                        <th>วันที่</th>
                        <th class="text-center max-[509px]:hidden">จำนวนทั้งหมด</th>
                        <th class="text-center max-[509px]:hidden">ผ่าน</th>
                        <th class="text-center max-[509px]:hidden">ไม่ผ่าน</th>
                        <th class="text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in sortedRows" :key="item._id">
                        <td>{{ item.grade ? mapGradeDisplay(item.grade) : '-' }}</td>
                        <td>{{ item.classroom ?? '-' }}</td>
                        <td class="max-[582px]:hidden">{{ item.inspector?.name || '-' }}</td>
                        <td>{{ formatThaiDate(item.date) }}</td>
                        <td class="text-center max-[509px]:hidden">{{ item.summary?.total ?? 0 }}</td>
                        <td class="text-center max-[509px]:hidden">{{ item.summary?.pass ?? 0 }}</td>
                        <td class="text-center max-[509px]:hidden">{{ item.summary?.not_pass ?? 0 }}</td>
                        <td class="text-center">
                            <div class="flex items-center justify-center gap-2">
                                <button @click="openDetail(item)" class="bg-transparent border-none shadow-none p-0"
                                    title="ดูรายละเอียดเพิ่มเติม">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                        viewBox="0 0 24 24" stroke="#3b82f6">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                                <button @click="openDelete(item)" class="bg-transparent border-none shadow-none p-0"
                                    v-if="canDeleteUniformInspection" title="ลบรายการ">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                        viewBox="0 0 24 24" stroke="#ef4444">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="!sortedRows.length">
                        <td colspan="8" class="text-center text-gray-500 py-6">ไม่พบข้อมูลการตรวจระเบียบการแต่งตัว</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="totalPages > 1" class="flex flex-col items-center gap-2 mt-4">
            <div class="flex justify-center">
                <div class="join">
                    <button class="join-item btn btn-sm" :disabled="pagination.page <= 1"
                        @click="changePage(pagination.page - 1)">
                        ก่อนหน้า
                    </button>
                    <button class="join-item btn btn-sm btn-active">{{ pagination.page }}/{{ totalPages }}</button>
                    <button class="join-item btn btn-sm" :disabled="pagination.page >= totalPages"
                        @click="changePage(pagination.page + 1)">
                        ถัดไป
                    </button>
                </div>
            </div>
            <div class="text-center text-sm text-base-content/60">
                ทั้งหมด {{ pagination.total }} รายการ (หน้า {{ pagination.page }} / {{ totalPages }})
            </div>
        </div>

        <UniformInspectionDetail ref="detailRef" />
        <UniformInspectionDelete v-if="canDeleteUniformInspection" ref="deleteRef" @success="loadData" />
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { UniformInspectionService } from '../../api/uniform_inspection';
import UniformInspectionDetail from './UniformInspectionDetail.vue';
import UniformInspectionDelete from './UniformInspectionDelete.vue';
import featureFlags from '../../config/featureFlags';
import { getGradeSortOrder, mapGradeDisplay } from '../../utils/gradeSystem';

const props = defineProps({
    filters: {
        type: Object,
        default: () => ({
            date: '',
            grade: '',
            classroom: '',
            limit: 50,
            page: 1,
        }),
    },
});

const uniformInspectionService = new UniformInspectionService();
const detailRef = ref(null);
const deleteRef = ref(null);
const loading = ref(false);
const rows = ref([]);
const canDeleteUniformInspection = featureFlags.reportUniformInspection?.enableDelete ?? true;
const pagination = ref({
    page: 1,
    limit: 50,
    total: 0,
});

const totalPages = computed(() => {
    const total = Number(pagination.value.total || 0);
    const limit = Number(pagination.value.limit || 50);
    if (!limit) return 1;
    return Math.max(1, Math.ceil(total / limit));
});

const getClassroomNumber = (classroom) => {
    const num = Number(classroom);
    return Number.isNaN(num) ? Number.MAX_SAFE_INTEGER : num;
};

const sortedRows = computed(() => {
    return [...rows.value].sort((a, b) => {
        const gradeDiff = getGradeSortOrder(a?.grade) - getGradeSortOrder(b?.grade);
        if (gradeDiff !== 0) return gradeDiff;

        const classroomDiff = getClassroomNumber(a?.classroom) - getClassroomNumber(b?.classroom);
        if (classroomDiff !== 0) return classroomDiff;

        return String(a?._id || '').localeCompare(String(b?._id || ''));
    });
});

const formatThaiDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

const buildQuery = (page = null) => {
    return {
        ...(props.filters?.date ? { date: props.filters.date } : {}),
        ...(props.filters?.grade ? { grade: props.filters.grade } : {}),
        ...(props.filters?.classroom !== '' && props.filters?.classroom !== null && props.filters?.classroom !== undefined
            ? { classroom: props.filters.classroom }
            : {}),
        limit: props.filters?.limit || pagination.value.limit || 50,
        page: page || props.filters?.page || pagination.value.page || 1,
    };
};

const loadData = async () => {
    loading.value = true;
    try {
        const query = buildQuery();

        const response = await uniformInspectionService.getUniformInspections(query);
        rows.value = response?.data || [];
        pagination.value = {
            page: Number(response?.page || query.page || 1),
            limit: Number(response?.limit || query.limit || 50),
            total: Number(response?.total || 0),
        };
    } catch (error) {
        console.error('Load uniform inspections error:', error);
        rows.value = [];
    } finally {
        loading.value = false;
    }
};

const openDetail = (item) => {
    detailRef.value?.openModal(item?._id);
};

const openDelete = (item) => {
    deleteRef.value?.open(item);
};

const changePage = async (page) => {
    if (page < 1 || page > totalPages.value) return;
    pagination.value.page = page;
    loading.value = true;
    try {
        const response = await uniformInspectionService.getUniformInspections(buildQuery(page));
        rows.value = response?.data || [];
        pagination.value = {
            page: Number(response?.page || page),
            limit: Number(response?.limit || pagination.value.limit || 50),
            total: Number(response?.total || 0),
        };
    } catch (error) {
        console.error('Change page uniform inspections error:', error);
    } finally {
        loading.value = false;
    }
};

watch(
    () => props.filters,
    () => {
        pagination.value.page = Number(props.filters?.page || 1);
        loadData();
    },
    { deep: true, immediate: true }
);
</script>
