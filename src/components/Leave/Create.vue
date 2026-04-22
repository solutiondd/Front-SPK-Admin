<template>
	<dialog ref="modalRef" class="modal">
		<div class="modal-box w-11/12 max-w-lg">
			<h3 class="font-bold text-lg mb-4">เพิ่มประเภทการลา</h3>

			<form @submit.prevent="handleSubmit" class="space-y-4">
				<div class="form-control">
					<label class="label">
						<span class="label-text">ชื่อประเภทการลา</span>
					</label>
					<input
						v-model.trim="formData.name"
						type="text"
						class="input input-bordered"
						placeholder="เช่น ลาป่วย"
						required
					/>
				</div>

				<div class="form-control">
					<label class="label">
						<span class="label-text">รายละเอียด</span>
					</label>
					<textarea
						v-model.trim="formData.description"
						class="textarea textarea-bordered"
						rows="3"
						placeholder="รายละเอียดเพิ่มเติมของประเภทการลา"
					></textarea>
				</div>

				<div class="flex flex-col gap-2 sm:flex-row sm:gap-6">
					<label class="label cursor-pointer justify-start gap-3">
						<input
							v-model="formData.enabled"
							type="checkbox"
							class="checkbox checkbox-primary"
						/>
						<span class="label-text">เปิดใช้งาน</span>
					</label>

					<label class="label cursor-pointer justify-start gap-3">
						<input
							v-model="formData.requires_attachment"
							type="checkbox"
							class="checkbox checkbox-primary"
						/>
						<span class="label-text">ต้องแนบไฟล์หลักฐาน</span>
					</label>
				</div>

				<div class="modal-action">
					<button
						type="button"
						class="btn btn-ghost"
						:disabled="loading"
						@click="closeModal"
					>
						ยกเลิก
					</button>
					<button type="submit" class="btn btn-primary" :disabled="loading">
						<span v-if="loading" class="loading loading-spinner loading-sm"></span>
						<span v-else>บันทึก</span>
					</button>
				</div>
			</form>
		</div>
	</dialog>
</template>

<script setup>
import { ref } from 'vue';
import Swal from 'sweetalert2';
import { LeaveService } from '../../api/leave';

const leaveService = new LeaveService();
const modalRef = ref(null);
const loading = ref(false);

const emit = defineEmits(['created']);

const initialForm = () => ({
	name: '',
	description: '',
	enabled: true,
	requires_attachment: false,
});

const formData = ref(initialForm());

const resetForm = () => {
	formData.value = initialForm();
};

const openModal = () => {
	resetForm();
	modalRef.value?.showModal();
};

const closeModal = () => {
	modalRef.value?.close();
};

const handleSubmit = async () => {
	if (!formData.value.name) {
		Swal.fire('แจ้งเตือน', 'กรุณาระบุชื่อประเภทการลา', 'warning');
		return;
	}

	loading.value = true;
	try {
		const response = await leaveService.createLeaveType({
			name: formData.value.name,
			description: formData.value.description,
			enabled: formData.value.enabled,
			requires_attachment: formData.value.requires_attachment,
		});

		emit('created', response?.data || response);
		Swal.fire('สำเร็จ', 'เพิ่มประเภทการลาเรียบร้อยแล้ว', 'success');
		closeModal();
		resetForm();
	} catch (error) {
		Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มประเภทการลาได้', 'error');
		console.error('Create leave type in CreateLeave.vue error:', error);
	} finally {
		loading.value = false;
	}
};

defineExpose({
	openModal,
	closeModal,
});
</script>
