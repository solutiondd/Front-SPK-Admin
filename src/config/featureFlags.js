// เก็บการตั้งค่าเปิด/ปิดฟีเจอร์สำหรับแต่ละโรงเรียน

export default {
  // ฟีเจอร์สำหรับตารางเข้า-ออก
  attendance: {
    enableLineupColumn: "true", // คอลัมแสดงข้อมูลเวลา เข้าแถว
  },

  // ฟีเจอร์สำหรับหน้าเช็คชื่อ
  checkName: {
    // person_confirmation: ต้องมี usecase = person_confirmation
    // any_timestamp: มี timeStamps มากกว่า 0 ก็ถือว่ามา
    presentMode:"person_confirmation", // โหมดการพิจารณาว่ามาแล้วหรือยังสำหรับหน้าเช็คชื่อ
  },

  // ฟีเจอร์สำหรับอุปกรณ์
  device: {
    enableUseCase: "true", // Use Case สำหรับการจัดการอุปกรณ์
  },
};
