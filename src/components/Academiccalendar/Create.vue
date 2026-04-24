<template>
    <dialog ref="modalRef" :id="modalId" class="modal">
        <div class="modal-box max-w-4xl">
            <h3 class="font-bold text-lg mb-4 text-primary">เพิ่มปฏิทินการศึกษา</h3>

            <form @submit.prevent="handleSubmit" class="space-y-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">ปีการศึกษา <span class="text-error">*</span></span>
                    </label>
                    <input v-model.number="academicYearBE" type="number" placeholder="เช่น 2569"
                        class="input input-bordered" :class="{ 'input-error': yearError }" required />
                    <label v-if="yearError" class="label">
                        <span class="label-text-alt text-error">{{ yearError }}</span>
                    </label>
                </div>

                <div class="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
                    <div v-for="(term, index) in formTerms" :key="index" class="rounded-lg border border-base-300 p-3">
                        <div class="flex items-center justify-between mb-3">
                            <p class="font-semibold">รายการที่ {{ index + 1 }}</p>
                            <button type="button" class="btn btn-xs btn-outline btn-error"
                                :disabled="loading || formTerms.length <= 1" @click="removeTerm(index)">
                                ลบรายการนี้
                            </button>
                        </div>

                        <div class="form-control mb-2">
                            <label class="label">
                                <span class="label-text">รายการ <span class="text-error">*</span></span>
                            </label>
                            <input v-model.trim="term.term" type="text" placeholder="เช่น เทอมที่ 1"
                                class="input input-bordered" :class="{ 'input-error': fieldErrors[index]?.term }" />
                            <label v-if="fieldErrors[index]?.term" class="label">
                                <span class="label-text-alt text-error">{{ fieldErrors[index].term }}</span>
                            </label>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">วันเริ่มต้น <span class="text-error">*</span></span>
                                </label>
                                <input v-model="term.start_date" type="date" class="input input-bordered"
                                    :class="{ 'input-error': fieldErrors[index]?.start_date }" />
                                <label v-if="fieldErrors[index]?.start_date" class="label">
                                    <span class="label-text-alt text-error">{{ fieldErrors[index].start_date }}</span>
                                </label>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">วันสิ้นสุด <span class="text-error">*</span></span>
                                </label>
                                <input v-model="term.end_date" type="date" class="input input-bordered"
                                    :class="{ 'input-error': fieldErrors[index]?.end_date }" />
                                <label v-if="fieldErrors[index]?.end_date" class="label">
                                    <span class="label-text-alt text-error">{{ fieldErrors[index].end_date }}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="button" class="btn btn-outline btn-primary btn-sm" @click="addTerm" :disabled="loading">
                    + เพิ่มรายการ
                </button>

                <div v-if="errorMessage" class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ errorMessage }}</span>
                </div>

                <div class="modal-action">
                    <button type="button" class="btn btn-ghost" @click="handleClose" :disabled="loading">
                        ยกเลิก
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                        <span v-else>บันทึกทั้งหมด</span>
                    </button>
                </div>
            </form>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button type="button" @click="handleClose" tabindex="-1" aria-label="Close modal">close</button>
        </form>
    </dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { AcademicCalendarService } from '../../api/academiccalendar'

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    },
    year: {
        type: [Number, String],
        default: () => new Date().getFullYear()
    },
    modalId: {
        type: String,
        default: 'create_academic_calendar_modal'
    }
})

const emit = defineEmits(['close', 'success'])

const modalRef = ref(null)
const academicCalendarService = new AcademicCalendarService()
const loading = ref(false)
const errorMessage = ref('')
const academicYear = ref(new Date().getFullYear())
const academicYearBE = computed({
    get: () => academicYear.value ? academicYear.value + 543 : '',
    set: (val) => {
        const parsed = Number(val)
        academicYear.value = (!Number.isNaN(parsed) && parsed > 0) ? (parsed > 2400 ? parsed - 543 : parsed) : ''
    }
})
const yearError = ref('')
const formTerms = ref([])
const fieldErrors = ref([])

const emptyTerm = () => ({
    term: '',
    start_date: '',
    end_date: ''
})

const normalizeDateInput = (value) => {
    if (!value) return ''
    return String(value).substring(0, 10)
}

const isDateRangeOverlap = (startA, endA, startB, endB) => {
    return startA <= endB && startB <= endA
}

const getAcademicCalendarList = async () => {
    const res = await academicCalendarService.getAcademicCalendar()
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data?.data)) return res.data.data
    return []
}

const validateOverlapWithExistingCalendars = async () => {
    const currentYear = Number(academicYear.value)
    const calendars = await getAcademicCalendarList()

    for (let i = 0; i < formTerms.value.length; i += 1) {
        const inputTerm = formTerms.value[i]
        const inputStart = normalizeDateInput(inputTerm.start_date)
        const inputEnd = normalizeDateInput(inputTerm.end_date)

        if (!inputStart || !inputEnd) continue

        for (const calendar of calendars) {
            const existingYear = Number(calendar?.academic_year)
            if (existingYear === currentYear) continue

            const existingTerms = Array.isArray(calendar?.terms) ? calendar.terms : []
            for (const existingTerm of existingTerms) {
                const existingStart = normalizeDateInput(existingTerm?.start_date)
                const existingEnd = normalizeDateInput(existingTerm?.end_date)
                if (!existingStart || !existingEnd) continue

                if (isDateRangeOverlap(inputStart, inputEnd, existingStart, existingEnd)) {
                    fieldErrors.value[i].end_date = 'ช่วงวันทับซ้อนกับปฏิทินปีอื่น'
                    errorMessage.value = `รายการที่ ${i + 1} ทับซ้อนกับปี ${existingYear + 543} (${existingTerm?.term || 'ไม่ระบุรายการ'})`
                    return false
                }
            }
        }
    }

    return true
}

const resetForm = () => {
    academicYear.value = Number(props.year) || new Date().getFullYear()
    yearError.value = ''
    errorMessage.value = ''
    formTerms.value = [emptyTerm(), emptyTerm()]
    fieldErrors.value = [{ term: '', start_date: '', end_date: '' }, { term: '', start_date: '', end_date: '' }]
}

const addTerm = () => {
    formTerms.value.push(emptyTerm())
    fieldErrors.value.push({ term: '', start_date: '', end_date: '' })
}

const removeTerm = (index) => {
    if (formTerms.value.length <= 1) return
    formTerms.value.splice(index, 1)
    fieldErrors.value.splice(index, 1)
}

const applyDuplicateTermError = (duplicateTermName) => {
    const target = (duplicateTermName || '').trim().toLowerCase()
    if (!target) return false

    let found = false
    formTerms.value.forEach((term, index) => {
        if ((term.term || '').trim().toLowerCase() === target) {
            fieldErrors.value[index].term = 'ชื่อซ้ำกันในรายการ'
            found = true
        }
    })

    return found
}

const validateForm = () => {
    let isValid = true
    yearError.value = ''
    fieldErrors.value = formTerms.value.map(() => ({ term: '', start_date: '', end_date: '' }))

    if (!academicYear.value || academicYear.value < 1900 || academicYear.value > 2200) {
        yearError.value = 'กรุณากรอกปีการศึกษาที่ถูกต้อง'
        isValid = false
    }

    formTerms.value.forEach((term, index) => {
        if (!term.term || !term.term.trim()) {
            fieldErrors.value[index].term = 'กรุณากรอกชื่อ'
            isValid = false
        }

        if (!term.start_date) {
            fieldErrors.value[index].start_date = 'กรุณาเลือกวันเริ่มต้น'
            isValid = false
        }

        if (!term.end_date) {
            fieldErrors.value[index].end_date = 'กรุณาเลือกวันสิ้นสุด'
            isValid = false
        }

        if (term.start_date) {
            const startYear = Number(term.start_date.substring(0, 4))
            if (Number(academicYear.value) !== startYear) {
                yearError.value = `ปีการศึกษาต้องตรงกับปีของวันเริ่มต้น (${startYear + 543})`
                isValid = false
            }
        }

        if (term.start_date && term.end_date && term.start_date >= term.end_date) {
            fieldErrors.value[index].end_date = 'วันสิ้นสุดต้องหลังจากวันเริ่มต้น'
            isValid = false
        }
    })

    for (let i = 0; i < formTerms.value.length; i += 1) {
        const termA = formTerms.value[i]
        if (!termA.start_date || !termA.end_date) continue

        for (let j = i + 1; j < formTerms.value.length; j += 1) {
            const termB = formTerms.value[j]
            if (!termB.start_date || !termB.end_date) continue

            if (isDateRangeOverlap(termA.start_date, termA.end_date, termB.start_date, termB.end_date)) {
                fieldErrors.value[i].end_date = `ช่วงวันทับซ้อนกับรายการที่ ${j + 1}`
                fieldErrors.value[j].end_date = `ช่วงวันทับซ้อนกับรายการที่ ${i + 1}`
                isValid = false
            }
        }
    }

    const firstIndexByTerm = new Map()
    formTerms.value.forEach((term, index) => {
        const key = (term.term || '').trim().toLowerCase()
        if (!key) return

        if (firstIndexByTerm.has(key)) {
            const firstIndex = firstIndexByTerm.get(key)
            fieldErrors.value[firstIndex].term = 'ชื่อซ้ำกันในรายการ'
            fieldErrors.value[index].term = 'ชื่อซ้ำกันในรายการ'
            isValid = false
            return
        }

        firstIndexByTerm.set(key, index)
    })

    return isValid
}

const handleSubmit = async () => {
    if (!validateForm()) return

    loading.value = true
    errorMessage.value = ''

    try {
        const hasNoOverlapWithExisting = await validateOverlapWithExistingCalendars()
        if (!hasNoOverlapWithExisting) return

        const payloadTerms = formTerms.value.map((term) => ({
            term: term.term.trim(),
            start_date: term.start_date,
            end_date: term.end_date
        }))

        const data = {
            academic_year: Number(academicYear.value),
            terms: payloadTerms
        }

        await academicCalendarService.createAcademicCalendar(data)
        emit('success')
        handleClose()
    } catch (error) {
        console.error('Create academic calendar error:', error)
        const msg = error.response?.data?.message
        const backendError = error.response?.data?.error || ''
        const duplicateTermName = backendError.startsWith('duplicate term in request:')
            ? backendError.split(':').slice(1).join(':').trim()
            : ''

        if (duplicateTermName) {
            applyDuplicateTermError(duplicateTermName)
            errorMessage.value = `ชื่อซ้ำกัน: ${duplicateTermName}`
            return
        }

        if (msg === 'Duplicate data') {
            errorMessage.value = `มีปฏิทินการศึกษาปี ${academicYear.value + 543} อยู่แล้ว กรุณาใช้การแก้ไขแทน`
        } else {
            errorMessage.value = error.response?.data?.error || error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มปฏิทินการศึกษา'
        }
    } finally {
        loading.value = false
    }
}

const handleClose = () => {
    resetForm()
    emit('close')
    if (modalRef.value) {
        modalRef.value.close()
    }
}

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        resetForm()
        if (modalRef.value) {
            modalRef.value.showModal()
        }
    } else {
        if (modalRef.value) {
            modalRef.value.close()
        }
    }
})
</script>

<style scoped></style>
