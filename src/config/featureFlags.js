export default {
  // ฟีเจอร์สำหรับระบบชั้นเรียน
  gradeSystem: {
    enableDisplayMapping: false, // true = แสดงชั้นเรียนแบบ NS/KG/YR ทั้งระบบ
    enableLowerLevels: false, // true = แสดงระดับ เตรียมอนุบาล-ป.6
    enablePromoteLevel: true, // true = แสดงปุ่มเลื่อนระดับห้องเรียน
  },

  // ฟีเจอร์สำหรับตารางเข้า-ออก
  attendance: {
    enableLineupColumn: true, // true = แสดงคอลัมน์เข้าแถว, false = ซ่อน
  },

  // ฟีเจอร์สำหรับหน้าเช็คชื่อ
  checkName: {
    // person_confirmation: ต้องมี usecase = person_confirmation
    // any_timestamp: มี timeStamps มากกว่า 0 ก็ถือว่ามา
    presentMode: "person_confirmation", // หมดการพิจารณาว่ามาแล้วหรือยังสำหรับหน้าเช็คชื่อ
  },

  // ฟีเจอร์สำหรับอุปกรณ์
  device: {
    enableUseCase: true, // true = แสดง Use Case, false = ซ่อน
  },

  // ฟีเจอร์สำหรับหน้านักเรียน
  student: {
    enableLineStatusFilter: true, // true = แสดงตัวกรองสถานะ LINE, false = ซ่อน
  },

  // ฟีเจอร์สำหรับเมนู
  menu: {
    enableUniformInspection: false, // เมนูตรวจเครื่องแบบ
    enableReportUniformInspection: false, // เมนูรายงานตรวจระเบียบ
  },
};
