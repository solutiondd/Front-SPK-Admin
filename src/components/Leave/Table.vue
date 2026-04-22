<template>
	<div class="w-full">
		<!-- <div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-bold">รายการลา</h3>
			<button type="button" class="btn btn-sm" :disabled="loading" @click="loadLeaveTypes">
				รีเฟรช
			</button>
		</div> -->

		<div v-if="loading" class="flex justify-center py-8">
			<span class="loading loading-spinner loading-lg"></span>
		</div>

		<div v-else class="overflow-x-auto">
			<table class="table table-zebra w-full text-sm">
				<thead>
					<tr class="bg-gray-100">
						<th>รายการ</th>
						<th>คำอธิบาย</th>
						<th class="text-center">เปิดใช้งาน</th>
						<th class="text-center">ต้องแนบเอกสาร</th>
						<th class="text-center"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="type in leaveTypes" :key="type._id">
						<td>{{ type.name || '-' }}</td>
						<td>{{ type.description || '-' }}</td>
						<td class="text-center text-base font-semibold">{{ type.enabled ? '✓' : '' }}</td>
						<td class="text-center text-base font-semibold">{{ type.requires_attachment ? '✓' : '' }}</td>
						<td class="text-center">
							<div class="flex items-center justify-center gap-2">
								<button
									v-if="auth.user?.role !== 'viewer'"
									@click="openEdit('type', type)"
									class="bg-transparent border-none shadow-none p-0"
									title="แก้ไข"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#fbbf24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<button
									v-if="auth.user?.role !== 'viewer'"
									@click="openDeleteModal(type)"
									class="bg-transparent border-none shadow-none p-0"
									title="ลบ"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</div>
						</td>
					</tr>
					<tr v-if="!leaveTypes.length">
						<td colspan="5" class="text-center text-gray-500 py-6">ไม่พบข้อมูลรายการลา</td>
					</tr>
				</tbody>
			</table>
		</div>

		<LeaveUpdate ref="leaveUpdateRef" @updated="loadLeaveTypes" />
		<LeaveDelete ref="leaveDeleteRef" @deleted="loadLeaveTypes" />
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { LeaveService } from '../../api/leave';
import LeaveUpdate from './Update.vue';
import LeaveDelete from './Delete.vue';
import { useAuthStore } from '../../stores/auth';

const leaveService = new LeaveService();
const auth = useAuthStore();
const loading = ref(false);
const leaveTypes = ref([]);
const leaveUpdateRef = ref(null);
const leaveDeleteRef = ref(null);

const openEdit = (typeName, data) => {
	if (typeName === 'type') {
		leaveUpdateRef.value?.openModal(data);
	}
};

const openDeleteModal = (item) => {
	leaveDeleteRef.value?.openModal(item);
};

const loadLeaveTypes = async () => {
	loading.value = true;
	try {
		const response = await leaveService.getLeaveTypes();
		leaveTypes.value = response?.data || [];
	} catch (error) {
		leaveTypes.value = [];
		Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายการลาได้', 'error');
		console.error('Load leave types error:', error);
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	loadLeaveTypes();
});

defineExpose({
	refresh: loadLeaveTypes,
});
</script>
