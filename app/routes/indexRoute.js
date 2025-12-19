const authRouter = require('./authRoute');
const userRouter = require('./userRoute');
const adminRouter = require('./adminRoute');
const assistantRouter = require('./assistantRoute');
const lecturerRouter = require('./lecturerRoute');
const studentRouter = require('./studentRoute');
const studentClassRoute = require('./studentClassRoute');
const scheduleRouter = require('./scheduleRoute');
const attendanceRouter = require('./attendanceRoute');

module.exports = function registerRoutes(app){
    app.use("/auth", authRouter);
    app.use("/admin", adminRouter);
    app.use("/assistant", assistantRouter);
    app.use("/lecturer", lecturerRouter);
    app.use("/student", studentRouter);
    
    app.use('/api/schedules', scheduleRouter);
    app.use('/classes', attendanceRouter);
    app.use('/classes', studentClassRoute);
    app.use("/", userRouter);
};