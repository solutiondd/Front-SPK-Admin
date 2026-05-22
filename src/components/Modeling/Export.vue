<template>
    <button class="btn btn-success btn-xs" :class="{ 'btn-disabled': loadingExport }" @click="exportToExcel"
        :disabled="loadingExport">
        <span v-if="loadingExport" class="loading loading-spinner loading-xs"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 16v-8m0 8l-3-3m3 3l3-3M4 20h16" />
        </svg>
        {{ loadingExport ? 'กำลังส่งออก...' : 'Export Excel' }}
    </button>
</template>

<script setup>
import { ref } from 'vue'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import Swal from 'sweetalert2'
import ModelingService from '../../api/modeling.js'

const loadingExport = ref(false)

const props = defineProps({
    filters: {
        type: Object,
        required: true,
    }
})

const statusTextMap = {
    all: 'ทั้งหมด',
    fail: 'ไม่สำเร็จ',
    notlinked: 'ไม่ได้เชื่อมต่อ',
}

function hasDevice(model) {
    return !!(model?.device && Object.keys(model.device).length > 0)
}

function normalizeRowsStatus(rows, status) {
    if (status === 'fail') {
        return rows.filter(row => Array.isArray(row?.modeling) && row.modeling.some(model => hasDevice(model) && model.status === 4))
    }
    if (status === 'notlinked') {
        return rows.filter(row => !Array.isArray(row?.modeling) || row.modeling.length === 0 || row.modeling.every(model => !hasDevice(model)))
    }
    return rows
}

function classOrDepartment(item) {
    if (item?.role === 'student') {
        const grade = item?.grade || '-'
        const classroom = item?.classroom || '-'
        return `${grade} / ${classroom}`
    }
    return item?.department || '-'
}

async function fetchAllRows() {
    const status = props.filters?.status || 'all'

    const baseParams = {
        role: props.filters?.role || 'student',
        name: props.filters?.name || '',
        department: props.filters?.department || '',
        userid: props.filters?.userid || '',
        status,
        grade: props.filters?.grade || '',
        classroom: props.filters?.classroom || '',
        page: 1,
        limit: 50,
    }

    if (baseParams.role === 'student') {
        baseParams.department = ''
    } else if (baseParams.role === 'teacher') {
        baseParams.grade = ''
        baseParams.classroom = '0'
    }

    let allRows = []
    let totalPages = 1
    let page = 1

    do {
        const res = await ModelingService.getModelings({ ...baseParams, page })
        const pageRows = Array.isArray(res?.data) ? res.data : []
        allRows = allRows.concat(pageRows)
        totalPages = Number(res?.total_pages) || 1
        page += 1
    } while (page <= totalPages)

    return normalizeRowsStatus(allRows, status)
}

async function exportToExcel() {
    if (loadingExport.value) return
    loadingExport.value = true
    try {
        const rows = await fetchAllRows()
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Modeling')

        const selectedStatus = props.filters?.status || 'all'
        worksheet.addRow(['การเชื่อมต่ออุปกรณ์'])
        worksheet.mergeCells('A1:C1')
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.getCell('A1').font = { bold: true, size: 14 }

        worksheet.addRow([`สถานะ: ${statusTextMap[selectedStatus] || 'ทั้งหมด'}`])
        worksheet.mergeCells('A2:C2')
        worksheet.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' }
        worksheet.getCell('A2').font = { bold: true }

        const header = ['รหัส', 'ชื่อ-สกุล', 'ห้องเรียน/แผนก']
        worksheet.addRow(header)
        worksheet.getRow(3).font = { bold: true }
        worksheet.getRow(3).alignment = { horizontal: 'center', vertical: 'middle' }

        rows.forEach(item => {
            worksheet.addRow([
                item?.userid || '-',
                item?.name || '-',
                classOrDepartment(item),
            ])
        })

        worksheet.columns = [
            { width: 18 },
            { width: 40 },
            { width: 30 },
        ]

        worksheet.getColumn(1).alignment = { horizontal: 'center', vertical: 'middle' }

        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `Modeling_${selectedStatus}.xlsx`)
    } catch (error) {
        console.error('Error exporting modeling excel:', error)
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถส่งออก Excel ได้',
        })
    } finally {
        loadingExport.value = false
    }
}
</script>

<style scoped></style>
