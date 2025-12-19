module.exports = {
    admin: [
        { 
            href: '/admin/home', 
            icon: 'fa-solid fa-house', 
            i18nKey: 'sidebar_home', 
            text: 'Trang chủ' 
        },
        { 
            href: '/admin/department', 
            icon: 'fa-solid fa-building-columns', 
            i18nKey: 'quản_lý_khoa', 
            text: 'Khoa' 
        },
        { 
            href: '/admin/staff', 
            icon: 'fa-solid fa-user-tie', 
            i18nKey: 'quản_lý_nhân_sự', 
            text: 'Nhân sự' 
        },
        { 
            href: '/auth/logout', 
            icon: 'fa-solid fa-right-from-bracket', 
            i18nKey: 'sidebar_sign_out', 
            text: 'Đăng xuất', 
            spacer: true 
        },
        { 
            href: '/admin/change_password', 
            icon: 'fa-solid fa-key', 
            i18nKey: 'sidebar_change_password', 
            text: 'Đổi mật khẩu' 
        }
    ],
    
    assistant: [
        { 
            href: '/assistant/home', 
            icon: 'fa-solid fa-house', 
            i18nKey: 'sidebar_home', 
            text: 'Trang chủ' 
        },
        { 
            href: '/assistant/timetable', 
            icon: 'fa-solid fa-calendar-days', 
            i18nKey: 'schedule_manage', 
            text: 'Lịch học' 
        },
        { 
            href: '/assistant/course',
            icon: 'fa-solid fa-graduation-cap',
            i18nKey: 'class_list', 
            text: 'Khóa học'
        },
        { 
            href: '/assistant/lecturer', 
            icon: 'fa-solid fa-chalkboard-user', 
            i18nKey: 'lecturer_manage', 
            text: 'Giảng viên' 
        },
        { 
            href: '/assistant/student', 
            icon: 'fa-solid fa-graduation-cap', 
            i18nKey: 'student_manage', 
            text: 'Sinh Viên' 
        },
        { 
            href: '/assistant/grade', 
            icon: 'fa-solid fa-clipboard-check', 
            i18nKey: 'grade_manage', 
            text: 'Điểm' 
        },
        { 
            href: '/auth/logout', 
            icon: 'fa-solid fa-right-from-bracket', 
            i18nKey: 'sidebar_sign_out', 
            text: 'Đăng xuất', 
            spacer: true 
        },
        { 
            href: '/assistant/change_password', 
            icon: 'fa-solid fa-key', 
            i18nKey: 'sidebar_change_password', 
            text: 'Đổi mật khẩu' 
        }
    ],
    
    lecturer: [
        { 
            href: '/lecturer/home', 
            icon: 'fa-solid fa-house', 
            i18nKey: 'sidebar_home', 
            text: 'Trang chủ' 
        },
        { 
            href: '/lecturer/course', 
            icon: 'fa-solid fa-users-rectangle', 
            i18nKey: 'class_list', 
            text: 'Điểm' 
        },
        { 
            href: '/lecturer/attendance', 
            icon: 'fa-solid fa-calendar-check', 
            i18nKey: 'attendance', 
            text: 'Điểm danh' 
        },
        { 
            href: '/lecturer/timetable', 
            icon: 'fa-solid fa-calendar-days', 
            i18nKey: 'schedule_manage', 
            text: 'Lịch giảng dạy' 
        },
        { 
            href: '/auth/logout', 
            icon: 'fa-solid fa-right-from-bracket', 
            i18nKey: 'sidebar_sign_out', 
            text: 'Đăng xuất', 
            spacer: true 
        },
        { 
            href: '/lecturer/change_password', 
            icon: 'fa-solid fa-key', 
            i18nKey: 'sidebar_change_password', 
            text: 'Đổi mật khẩu' 
        }
    ],
    
    student: [
        { 
            href: '/student/home', 
            icon: 'fa-solid fa-house', 
            i18nKey: 'sidebar_home', 
            text: 'Trang chủ' 
        },
        { 
            href: '/student/timetable', 
            icon: 'fa-solid fa-calendar-days', 
            i18nKey: 'sidebar_schedule', 
            text: 'Thời khóa biểu' 
        },
        { 
            href: '/student/results', 
            icon: 'fa-solid fa-chart-bar', 
            i18nKey: 'sidebar_results', 
            text: 'Kết quả' 
        },
        { 
            href: '/auth/logout', 
            icon: 'fa-solid fa-right-from-bracket', 
            i18nKey: 'sidebar_sign_out', 
            text: 'Đăng xuất', 
            spacer: true 
        },
        { 
            href: '/student/change_password', 
            icon: 'fa-solid fa-key', 
            i18nKey: 'sidebar_change_password', 
            text: 'Đổi mật khẩu' 
        }
    ]
};