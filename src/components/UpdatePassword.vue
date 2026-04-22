<template>
    <div class="max-w-md mx-auto mt-10 p-6 bg-base-100 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4 text-primary">เปลี่ยนรหัสผ่าน</h2>
        <form @submit.prevent="onSubmit" class="space-y-4">
            <div>
                <label class="label">รหัสผ่านเดิม</label>
                <div class="relative">
                    <input v-model="form.old_password" :type="showOldPassword ? 'text' : 'password'"
                        class="input input-bordered w-full pr-10" required minlength="4" />
                    <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-0"
                        @click="showOldPassword = !showOldPassword">
                        <span>{{ showOldPassword ? 'ซ่อน' : 'แสดง' }}</span>
                    </button>
                </div>
                <p v-if="errors.old_password" class="text-error text-xs mt-1">{{ errors.old_password }}</p>
            </div>
            <div>
                <label class="label">รหัสผ่านใหม่</label>
                <div class="relative">
                    <input v-model="form.new_password" :type="showNewPassword ? 'text' : 'password'"
                        class="input input-bordered w-full pr-10" required minlength="4" />
                    <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-0"
                        @click="showNewPassword = !showNewPassword">
                        <span>{{ showNewPassword ? 'ซ่อน' : 'แสดง' }}</span>
                    </button>
                </div>
                <p v-if="errors.new_password" class="text-error text-xs mt-1">{{ errors.new_password }}</p>
            </div>
            <button type="submit" class="btn btn-primary w-full" :disabled="loading">
                <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                <span v-else>บันทึก</span>
            </button>
            <p v-if="formError" class="text-error text-xs text-center mt-2">{{ formError }}</p>
            <p v-if="success" class="text-success text-xs text-center mt-2">เปลี่ยนรหัสผ่านสำเร็จ</p>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const form = ref({ old_password: '', new_password: '' })
const errors = ref({ old_password: '', new_password: '' })
const loading = ref(false)
const formError = ref('')
const success = ref(false)
const showOldPassword = ref(false)
const showNewPassword = ref(false)

function validate() {
    errors.value.old_password = form.value.old_password.length >= 4 ? '' : 'กรุณากรอกรหัสผ่านเดิม (อย่างน้อย 4 ตัว)'
    errors.value.new_password = form.value.new_password.length >= 4 ? '' : 'กรุณากรอกรหัสผ่านใหม่ (อย่างน้อย 4 ตัว)'
    return !errors.value.old_password && !errors.value.new_password
}

async function onSubmit() {
    formError.value = ''
    success.value = false
    if (!validate()) return
    loading.value = true
    try {
        const params = new URLSearchParams()
        params.append('old_password', form.value.old_password)
        params.append('new_password', form.value.new_password)
        const token = localStorage.getItem('token')
        const response = await axios.patch(
            `${import.meta.env.VITE_APP_BASE_URL}users/password`,
            params,
            {
                skipAuthRedirect: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`,
                },
            }
        )
        if (response.data && response.data.message === 'Success') {
            success.value = true
            form.value.old_password = ''
            form.value.new_password = ''
            await Swal.fire({
                icon: 'success',
                title: 'เปลี่ยนรหัสผ่านสำเร็จ',
                text: 'รหัสผ่านใหม่ถูกบันทึกเรียบร้อย',
                timer: 1800,
                showConfirmButton: false
            })
        } else {
            throw new Error(response.data.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
        }
    } catch (e) {
        const status = e.response?.status
        if (status === 401) {
            formError.value = 'ใส่รหัสผ่านเดิมผิด'
        } else {
            formError.value = e.response?.data?.message || e.message || 'เกิดข้อผิดพลาด'
        }
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: formError.value,
            timer: 2200,
            showConfirmButton: false
        })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped></style>
