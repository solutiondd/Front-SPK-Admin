<template>
    <div class="card bg-base-100 shadow-xl">
        <div class="card-body p-3">
            <div v-if="auth.user?.role !== 'viewer'" class="flex justify-end gap-2 mb-2">
                <button @click="handleEditAll" class="btn btn-warning btn-sm text-white" :disabled="!terms.length">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button @click="emit('delete')" class="btn btn-error btn-sm text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="table table-zebra table-xs sm:table-sm md:table-md">
                    <thead>
                        <tr>
                            <th class="bg-primary text-primary-content w-[50%]">รายการ</th>
                            <th class="bg-primary text-primary-content">วันเริ่มต้น</th>
                            <th class="bg-primary text-primary-content">วันสิ้นสุด</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="3" class="text-center py-8">
                                <span class="loading loading-spinner loading-lg text-primary"></span>
                            </td>
                        </tr>
                        <tr v-else-if="!terms.length">
                            <td colspan="3" class="text-center py-8 text-base-content/50">
                                ไม่มีข้อมูลปฏิทินการศึกษา
                            </td>
                        </tr>
                        <tr v-else v-for="(item, idx) in terms" :key="idx" class="hover cursor-pointer"
                            :class="{ 'bg-primary/10 ring-1 ring-primary/30': selectedIndex === idx }"
                            @click="handleSelectTerm(item, idx)">
                            <td>{{ item.term }}</td>
                            <td>
                                <span class="hidden lg:inline">{{ formatDate(item.start_date) }}</span>
                                <span class="lg:hidden">{{ formatDateShort(item.start_date) }}</span>
                            </td>
                            <td>
                                <span class="hidden lg:inline">{{ formatDate(item.end_date) }}</span>
                                <span class="lg:hidden">{{ formatDateShort(item.end_date) }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { AcademicCalendarService } from '../../api/academiccalendar';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const props = defineProps({
    year: {
        type: [Number, String],
        required: true
    },
    refreshKey: {
        type: Number,
        default: 0
    }
});

const emit = defineEmits(['edit', 'delete', 'select-term']);

const loading = ref(false);
const terms = ref([]);
const selectedIndex = ref(0);

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const handleEditAll = () => {
    emit('edit', {
        year: props.year,
        terms: terms.value
    });
};

const getTermKey = (item, idx) => {
    const termName = String(item?.term || '').toLowerCase();
    if (termName.includes('2')) return 'term2';
    if (termName.includes('1')) return 'term1';
    return idx === 1 ? 'term2' : 'term1';
};

const handleSelectTerm = (item, idx) => {
    selectedIndex.value = idx;
    emit('select-term', getTermKey(item, idx));
};

const fetchData = async () => {
    loading.value = true;
    try {
        const service = new AcademicCalendarService();
        const res = await service.getAcademicCalendarByYear(props.year);
        terms.value = res?.data?.terms ?? [];
        selectedIndex.value = 0;
        if (terms.value.length > 0) {
            emit('select-term', getTermKey(terms.value[0], 0));
        }
    } catch (error) {
        terms.value = [];
        selectedIndex.value = 0;
    } finally {
        loading.value = false;
    }
};

watch(() => props.year, fetchData);
watch(() => props.refreshKey, fetchData);
onMounted(fetchData);
</script>
