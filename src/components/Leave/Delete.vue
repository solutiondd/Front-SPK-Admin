<template>
	<dialog ref="modalRef" class="modal">
		<div class="modal-box w-11/12 max-w-md">
			<h3 class="font-bold text-lg mb-3">ยืนยันการลบ</h3>
			<p class="text-sm text-gray-600">
				คุณต้องการลบประเภทการลา
				<span class="font-semibold text-gray-800">"{{ selectedName || '-' }}"</span>
				หรือไม่?
			</p>

			<div class="modal-action">
				<button type="button" class="btn btn-ghost" :disabled="loading" @click="closeModal">ยกเลิก</button>
				<button type="button" class="btn btn-error" :disabled="loading" @click="handleDelete">
					<span v-if="loading" class="loading loading-spinner loading-sm"></span>
					<span v-else>ลบ</span>
				</button>
			</div>
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
const selectedId = ref('');
const selectedName = ref('');

const emit = defineEmits(['deleted']);

const openModal = (leaveType) => {
	selectedId.value = leaveType?._id || '';
	selectedName.value = leaveType?.name || '';
	modalRef.value?.showModal();
};

const closeModal = () => {
	modalRef.value?.close();
};

const resetState = () => {
	selectedId.value = '';
	selectedName.value = '';
};

const handleDelete = async () => {
	if (!selectedId.value) {
		Swal.fire('แจ้งเตือน', 'ไม่พบรายการที่ต้องการลบ', 'warning');
		return;
	}

	loading.value = true;
	try {
		const response = await leaveService.deleteLeaveType(selectedId.value);
		emit('deleted', response?.data || response);
		Swal.fire('สำเร็จ', 'ลบประเภทการลาเรียบร้อยแล้ว', 'success');
		closeModal();
		resetState();
	} catch (error) {
		Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบประเภทการลาได้', 'error');
		console.error('Delete leave type error:', error);
	} finally {
		loading.value = false;
	}
};

defineExpose({
	openModal,
	closeModal,
});
</script>
