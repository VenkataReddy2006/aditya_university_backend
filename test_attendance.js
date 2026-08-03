const { getAttendance } = require('./src/services/acetAttendance.service');
async function test() {
  await getAttendance('24P31A1243', 'Nikhil@6893');
  process.exit(0);
}
test();
