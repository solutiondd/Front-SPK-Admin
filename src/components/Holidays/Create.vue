<template>
    <div class="p-4 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-2 sm:mb-4">เพิ่มวันหยุด</h2>
        <div class="mb-4 flex justify-end">
            <button class="btn btn-info btn-sm" @click="openImportDialog" type="button">สร้างวันหยุดตามปฏิทิน</button>
        </div>
        <form @submit.prevent="addHoliday" class="space-y-4">
            <div v-if="showImportDialog"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div class="bg-base-100 rounded-lg shadow-lg p-6 w-full max-w-xs relative animate-fade-in">
                    <h3 class="font-bold mb-4">เลือกปีที่ต้องการนำเข้า</h3>
                    <div class="flex flex-col gap-2">
                        <button class="btn btn-outline" @click="importHolidaysByYear(currentYear)">ปีนี้ ({{
                            currentYearBE
                            }})</button>
                        <button class="btn btn-outline" @click="importHolidaysByYear(nextYear)">ปีหน้า ({{
                            nextYearBE }})</button>
                    </div>
                    <button class="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost"
                        @click="showImportDialog = false">✕</button>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                <div class="flex-1">
                    <label class="block mb-1 font-medium text-sm sm:text-base">ชื่อวันหยุด</label>
                    <input v-model="newHoliday.summary" type="text"
                        class="input input-bordered w-full text-sm sm:text-base px-1 py-1 sm:px-3 sm:py-2 h-10 sm:h-12"
                        required />
                </div>
                <div class="flex-1">
                    <label class="block mb-1 font-medium text-sm sm:text-base">วันที่ (เลือกได้หลายวัน)</label>
                    <flat-pickr v-model="newHoliday.dates" :config="flatpickrConfig"
                        class="input input-bordered w-full text-sm sm:text-base px-1 py-1 sm:px-3 sm:py-2 h-10 sm:h-12"
                        required />
                </div>
            </div>
            <button type="button" class="btn btn-secondary w-full h-10 sm:h-12" @click="addHoliday"
                :disabled="!canAddHoliday">เพิ่มรายการ</button>
        </form>

        <div v-if="holidays.length" class="mt-3">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-semibold">รายการวันหยุดที่เพิ่ม</h3>
                <form @submit.prevent="handleSubmit" class="flex justify-end">
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        <span v-if="loading">กำลังบันทึก...</span>
                        <span v-else>บันทึก</span>
                    </button>
                </form>
            </div>
            <table class="table w-full mb-4">
                <thead>
                    <tr>
                        <th>ชื่อวันหยุด</th>
                        <th>วันที่</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in pagedHolidays" :key="item.summary + '_' + item.date">
                        <td>{{ item.summary }}</td>
                        <td>{{ formatDisplayDate(item.date) }}</td>
                        <td><button class="btn btn-xs btn-error" @click="removeHoliday(item)">ลบ</button></td>
                    </tr>
                </tbody>
            </table>
            <div v-if="totalPages > 1" class="flex justify-center items-center mb-2">
                <div class="join gap-1">
                    <button class="join-item btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">‹</button>
                    <template v-for="page in visiblePages" :key="page">
                        <button class="join-item btn btn-sm" :class="{ 'btn-active': page === currentPage }"
                            @click="currentPage = page">{{ page }}</button>
                    </template>
                    <button class="join-item btn btn-sm" :disabled="currentPage === totalPages"
                        @click="currentPage++">›</button>
                </div>
            </div>
            <!-- <form @submit.prevent="handleSubmit" class="flex justify-end">
                <button type="submit" class="btn btn-primary mt-2" :disabled="loading">
                    <span v-if="loading">กำลังบันทึก...</span>
                    <span v-else>บันทึก</span>
                </button>
            </form> -->
        </div>
    </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue'
import holidaysApi, { fetchExternalHolidays } from '../../api/holidays'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Thai } from 'flatpickr/dist/l10n/th.js'
import Swal from 'sweetalert2'
const showImportDialog = ref(false)
const currentYear = new Date().getFullYear()
const currentYearBE = currentYear + 543
const nextYear = currentYear + 1
const nextYearBE = nextYear + 543
const allExternalHolidays = ref([])

async function openImportDialog() {
    if (allExternalHolidays.value.length === 0) {
        try {
            const data = await fetchExternalHolidays();
            console.log('Fetched external holidays:', data);
            if (data && Array.isArray(data.VCALENDAR)) {
                allExternalHolidays.value = data.VCALENDAR.flatMap(cal => cal.VEVENT || []);
                console.log('Parsed VEVENTs:', allExternalHolidays.value);
            } else {
                allExternalHolidays.value = [];
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'ดึงข้อมูลวันหยุดล้มเหลว', text: e?.message || '', showConfirmButton: true })
            return;
        }
    }
    showImportDialog.value = true;
}

async function importHolidaysByYear(year) {
    showImportDialog.value = false
    const vevents = allExternalHolidays.value
    const holidaysToAdd = vevents.filter(ev => {
        const y = String(ev['DTSTART;VALUE=DATE']).slice(0, 4)
        return Number(y) === year
    }).map(ev => ({
        summary: ev.SUMMARY,
        date: formatDateFromICal(ev['DTSTART;VALUE=DATE'])
    }))
    if (!holidaysToAdd.length) {
        Swal.fire({ icon: 'info', title: 'ไม่พบวันหยุดในปีที่เลือก', showConfirmButton: true })
        return
    }
    const exists = new Set(holidays.value.map(h => h.summary + h.date))
    holidaysToAdd.forEach(h => {
        const key = h.summary + h.date
        if (!exists.has(key)) holidays.value.push(h)
    })
    Swal.fire({ icon: 'success', title: 'นำเข้าวันหยุดสำเร็จ', showConfirmButton: false, timer: 1200 })
}

function formatDateFromICal(ical) {
    if (!ical || ical.length !== 8) return '';
    const y = ical.slice(0, 4);
    const m = ical.slice(4, 6);
    const d = ical.slice(6, 8);
    return `${y}-${m}-${d}`;
}

const newHoliday = ref({ summary: '', dates: [] })
const holidays = ref([])
const loading = ref(false)
const error = ref('')
const success = ref(false)
const pageSize = 3
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(holidays.value.length / pageSize))
const pagedHolidays = computed(() => {
    const sorted = [...holidays.value].sort((a, b) => {
        const toISO = (d) => {
            if (typeof d === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
                const [day, month, year] = d.split('/');
                return `${year}-${month}-${day}`;
            }
            return d;
        };
        return new Date(toISO(a.date)) - new Date(toISO(b.date));
    });
    const start = (currentPage.value - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
})
watch(holidays, () => { currentPage.value = 1 })

const visiblePages = computed(() => {
    const windowSize = 5;
    let start = Math.max(1, currentPage.value - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalPages.value) {
        end = totalPages.value;
        start = Math.max(1, end - windowSize + 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
});

const flatpickrConfig = {
    mode: 'multiple',
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    locale: {
        ...Thai,
        firstDayOfWeek: 1
    },
    formatDate: (date, format) => {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()

        if (format === 'Y-m-d') return `${year}-${month}-${day}`
        if (format === 'd/m/Y') return `${day}/${month}/${year + 543}`
        return `${day}/${month}/${year + 543}`
    },
    parseDate: (dateStr, format) => {
        if (format === 'd/m/Y') {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                let year = parseInt(parts[2]);
                if (year > 2400) year -= 543;
                return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
        }
        return new Date(dateStr);
    },
    enableTime: false,
    allowInput: true
}

const canAddHoliday = computed(() => {
    return newHoliday.value.summary && newHoliday.value.dates && newHoliday.value.dates.length > 0
})

function addHoliday() {
    if (!canAddHoliday.value) return
    let datesArr = []
    if (Array.isArray(newHoliday.value.dates)) {
        datesArr = newHoliday.value.dates
    } else if (typeof newHoliday.value.dates === 'string') {
        datesArr = newHoliday.value.dates.split(',')
    }
    datesArr.forEach(date => {
        holidays.value.push({
            summary: newHoliday.value.summary,
            date: formatDate(date)
        })
    })
    newHoliday.value.summary = ''
    newHoliday.value.dates = []
}


function removeHoliday(item) {
    const idx = holidays.value.findIndex(h => h.summary === item.summary && h.date === item.date);
    if (idx !== -1) {
        holidays.value.splice(idx, 1);
    }
}


function formatDate(date) {
    if (!date) return ''
    let dObj
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            const [d, m, y] = date.split('/')
            return `${y}-${m}-${d}`
        }
        dObj = new Date(date)
    } else {
        dObj = date
    }
    if (dObj instanceof Date && !isNaN(dObj)) {
        const y = dObj.getFullYear()
        const m = String(dObj.getMonth() + 1).padStart(2, '0')
        const d = String(dObj.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }
    return ''
}

function formatDisplayDate(date) {
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

    let year
    let month
    let day

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [y, m, d] = date.split('-').map(Number)
        year = y
        month = m
        day = d
    } else if (typeof date === 'string' && /^\d{8}$/.test(date)) {
        year = Number(date.slice(0, 4))
        month = Number(date.slice(4, 6))
        day = Number(date.slice(6, 8))
    } else if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [d, m, y] = date.split('/').map(Number)
        year = y
        month = m
        day = d
    } else {
        const parsed = new Date(date)
        year = parsed.getFullYear()
        month = parsed.getMonth() + 1
        day = parsed.getDate()
    }

    if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return '-'
    }

    const buddhistYear = year > 2400 ? year : year + 543
    return `${day} ${thaiMonths[month - 1]} ${buddhistYear}`
}

const emit = defineEmits(['saved'])
async function handleSubmit() {
    if (!holidays.value.length) return
    loading.value = true
    error.value = ''
    success.value = false
    try {
        let all = [...holidays.value]
        let successCount = 0
        while (all.length > 0) {
            const batch = all.splice(0, 100)
            await holidaysApi.createHoliday(batch)
            successCount += batch.length
        }
        success.value = true
        holidays.value = []
        Swal.fire({
            icon: 'success',
            title: `เพิ่มวันหยุดสำเร็จ ${successCount} รายการ`,
            showConfirmButton: false,
            timer: 1500
        })
        emit('saved')
    } catch (e) {
        error.value = 'เกิดข้อผิดพลาดในการบันทึกวันหยุด'
        Swal.fire({
            icon: 'error',
            title: 'เพิ่มวันหยุดไม่สำเร็จ',
            text: error.value,
            showConfirmButton: true
        })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.input {
    margin-bottom: 0.5rem;
}

.table {
    width: 100%;
    border-collapse: collapse;
}

.table th,
.table td {
    border: 1px solid #e5e7eb;
    padding: 0.5rem;
    text-align: left;
}
</style>
