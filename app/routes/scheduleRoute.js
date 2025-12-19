"use strict";

const express = require("express");
const router = express.Router();
const AuthMiddleware = require('../middlewares/authMiddleware');
const ScheduleController = require("../controllers/scheduleController");

router.use(AuthMiddleware);
router.get("/", ScheduleController.listPublicSchedules);
router.get("/assistant/timetable", ScheduleController.getAssistantTimetable);
router.get("/options/classes", ScheduleController.getClassOptions);
router.get("/options/lecturers", ScheduleController.getLecturerOptions);

router.get('/sync-all', ScheduleController.syncAllAttendance);

router.post("/", ScheduleController.createSchedule);

router.put("/:scheduleId", ScheduleController.updateSchedule);

router.delete("/:scheduleId/occurrence/:date", ScheduleController.deleteSingleOccurrence);
router.delete("/:scheduleId", ScheduleController.deleteSchedule);

router.patch("/:scheduleId/cancel", ScheduleController.toggleScheduleStatus);
router.patch("/:scheduleId/occurrence/:date", ScheduleController.editSingleOccurrence);

module.exports = router;