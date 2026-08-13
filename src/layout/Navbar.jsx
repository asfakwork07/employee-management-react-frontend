// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Swal from 'sweetalert2';

// import { auth, notifications } from '../api/services';

// function getErrorMessage(error, fallback = 'Something went wrong.') {
//   if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
//     return error.response.data;
//   }

//   return (
//     error?.response?.data?.detail ||
//     error?.response?.data?.message ||
//     error?.message ||
//     fallback
//   );
// }

// function getNotificationIcon(type) {
//   switch (type) {
//     case 'LEAVE_APPLIED':
//       return 'bi-calendar-plus';
//     case 'LEAVE_APPROVED':
//       return 'bi-check-circle-fill';
//     case 'LEAVE_REJECTED':
//       return 'bi-x-circle-fill';
//     case 'SALARY_GENERATED':
//       return 'bi-wallet2';
//     case 'ACCOUNT_CREATED':
//       return 'bi-person-plus-fill';
//     case 'ACCOUNT_DISABLED':
//       return 'bi-person-slash';
//     case 'ACCOUNT_ENABLED':
//       return 'bi-person-check-fill';
//     case 'PASSWORD_RESET':
//       return 'bi-key-fill';
//     default:
//       return 'bi-bell-fill';
//   }
// }

// function getNotificationIconClass(type) {
//   switch (type) {
//     case 'LEAVE_APPLIED':
//       return 'bg-blue-100 text-blue-600';
//     case 'LEAVE_APPROVED':
//       return 'bg-green-100 text-green-600';
//     case 'LEAVE_REJECTED':
//       return 'bg-red-100 text-red-600';
//     case 'SALARY_GENERATED':
//       return 'bg-purple-100 text-purple-600';
//     case 'ACCOUNT_CREATED':
//       return 'bg-indigo-100 text-indigo-600';
//     case 'ACCOUNT_DISABLED':
//       return 'bg-red-100 text-red-600';
//     case 'ACCOUNT_ENABLED':
//       return 'bg-green-100 text-green-600';
//     case 'PASSWORD_RESET':
//       return 'bg-yellow-100 text-yellow-700';
//     default:
//       return 'bg-gray-100 text-gray-600';
//   }
// }

// function formatNotificationDate(value) {
//   if (!value) {
//     return '';
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return value;
//   }

//   return new Intl.DateTimeFormat('en-IN', {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: true,
//   }).format(date);
// }

// export default function Navbar({ onLogout }) {
//   const navigate = useNavigate();
//   const notificationBoxRef = useRef(null);

//   const role = localStorage.getItem('role') || '';
//   const userName = localStorage.getItem('userName') || '';
//   const employeeName = localStorage.getItem('employeeName') || '';

//   const [showNotifications, setShowNotifications] = useState(false);
//   const [notificationList, setNotificationList] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [notificationLoading, setNotificationLoading] = useState(false);

//   const [showPasswordModal, setShowPasswordModal] = useState(false);
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [changingPassword, setChangingPassword] = useState(false);

//   const todayText = useMemo(
//     () =>
//       new Intl.DateTimeFormat('en-IN', {
//         weekday: 'long',
//         day: '2-digit',
//         month: 'long',
//         year: 'numeric',
//       }).format(new Date()),
//     [],
//   );

//   const loadUnreadCount = useCallback(async () => {
//     try {
//       const response = await notifications.count();
//       setUnreadCount(response?.data?.unreadCount || 0);
//     } catch (error) {
//       console.error('Unread notification count error:', error);
//     }
//   }, []);

//   const loadNotifications = useCallback(async () => {
//     setNotificationLoading(true);

//     try {
//       const response = await notifications.all();
//       setNotificationList(response?.data || []);
//     } catch (error) {
//       console.error('Notification loading error:', error);
//     } finally {
//       setNotificationLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadUnreadCount();

//     const pollingId = window.setInterval(() => {
//       loadUnreadCount();

//       if (showNotifications) {
//         loadNotifications();
//       }
//     }, 100000);

//     return () => {
//       window.clearInterval(pollingId);
//     };
//   }, [loadNotifications, loadUnreadCount, showNotifications]);

//   useEffect(() => {
//     function handleOutsideClick(event) {
//       if (
//         showNotifications &&
//         notificationBoxRef.current &&
//         !notificationBoxRef.current.contains(event.target)
//       ) {
//         setShowNotifications(false);
//       }
//     }

//     document.addEventListener('mousedown', handleOutsideClick);

//     return () => {
//       document.removeEventListener('mousedown', handleOutsideClick);
//     };
//   }, [showNotifications]);

//   const toggleNotifications = async () => {
//     const next = !showNotifications;
//     setShowNotifications(next);

//     if (next) {
//       await loadNotifications();
//     }
//   };

//   const navigateForNotification = (notification) => {
//     setShowNotifications(false);

//     switch (notification.type) {
//       case 'LEAVE_APPLIED':
//       case 'LEAVE_APPROVED':
//       case 'LEAVE_REJECTED':
//         navigate('/leaves');
//         break;

//       case 'SALARY_GENERATED':
//         navigate('/salary');
//         break;

//       case 'ACCOUNT_CREATED':
//       case 'PASSWORD_RESET':
//       case 'ACCOUNT_ENABLED':
//       case 'ACCOUNT_DISABLED':
//         navigate(role === 'ADMIN' ? '/employees' : '/dashboard');
//         break;

//       default:
//         navigate('/dashboard');
//     }
//   };

//   const openNotification = async (notification) => {
//     if (!notification.read) {
//       try {
//         await notifications.read(notification.id);

//         setNotificationList((current) =>
//           current.map((item) =>
//             item.id === notification.id ? { ...item, read: true } : item,
//           ),
//         );

//         setUnreadCount((count) => Math.max(count - 1, 0));
//       } catch (error) {
//         console.error('Unable to mark notification as read:', error);
//       }
//     }

//     navigateForNotification(notification);
//   };

//   const markAllNotificationsRead = async () => {
//     if (unreadCount === 0) {
//       return;
//     }

//     try {
//       await notifications.readAll();

//       setNotificationList((current) =>
//         current.map((item) => ({ ...item, read: true })),
//       );

//       setUnreadCount(0);
//     } catch (error) {
//       console.error('Unable to mark all notifications as read:', error);
//     }
//   };

//   const deleteNotification = async (notification, event) => {
//     event.stopPropagation();

//     try {
//       await notifications.remove(notification.id);

//       setNotificationList((current) =>
//         current.filter((item) => item.id !== notification.id),
//       );

//       if (!notification.read) {
//         setUnreadCount((count) => Math.max(count - 1, 0));
//       }
//     } catch (error) {
//       console.error('Delete notification error:', error);

//       Swal.fire('Error', 'Unable to delete notification.', 'error');
//     }
//   };

//   const clearAllNotifications = async () => {
//     if (notificationList.length === 0) {
//       return;
//     }

//     const result = await Swal.fire({
//       title: 'Clear Notifications?',
//       text: 'All notifications will be removed.',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Clear All',
//       cancelButtonText: 'Cancel',
//       confirmButtonColor: '#dc2626',
//     });

//     if (!result.isConfirmed) {
//       return;
//     }

//     try {
//       await notifications.clear();
//       setNotificationList([]);
//       setUnreadCount(0);
//     } catch (error) {
//       console.error('Clear notifications error:', error);
//       Swal.fire('Error', 'Unable to clear notifications.', 'error');
//     }
//   };

//   const openPasswordModal = () => {
//     setCurrentPassword('');
//     setNewPassword('');
//     setConfirmPassword('');
//     setShowNotifications(false);
//     setShowPasswordModal(true);
//   };

//   const closePasswordModal = () => {
//     if (changingPassword) {
//       return;
//     }

//     setShowPasswordModal(false);
//   };

//   const changePassword = async () => {
//     if (!currentPassword || !newPassword || !confirmPassword) {
//       Swal.fire('Missing Fields', 'Please fill all password fields.', 'warning');
//       return;
//     }

//     if (newPassword.length < 8) {
//       Swal.fire(
//         'Invalid Password',
//         'New password must be at least 8 characters.',
//         'warning',
//       );
//       return;
//     }

//     if (newPassword !== confirmPassword) {
//       Swal.fire(
//         'Password Mismatch',
//         'New password and confirm password do not match.',
//         'warning',
//       );
//       return;
//     }

//     setChangingPassword(true);

//     try {
//       await auth.changePassword({
//         currentPassword,
//         newPassword,
//       });

//       setShowPasswordModal(false);

//       await Swal.fire({
//         icon: 'success',
//         title: 'Password Changed',
//         text: 'Your password has been changed successfully. Please login again.',
//         confirmButtonText: 'Login Again',
//       });

//       if (onLogout) {
//         onLogout();
//       } else {
//         localStorage.clear();
//         navigate('/login', { replace: true });
//       }
//     } catch (error) {
//       Swal.fire({
//         icon: 'error',
//         title: 'Unable to Change Password',
//         text: getErrorMessage(error),
//       });
//     } finally {
//       setChangingPassword(false);
//     }
//   };

//   return (
//     <>
//       <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
//         <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4">
//           <div>
//             <h1 className="text-lg font-bold text-slate-800">
//               Employee Management System
//             </h1>

//             <p className="hidden sm:block text-xs text-gray-500 mt-0.5">
//               {todayText}
//             </p>
//           </div>

//           <div className="flex items-center gap-2">
//             <div ref={notificationBoxRef} className="relative">
//               <button
//                 type="button"
//                 onClick={toggleNotifications}
//                 className="relative w-10 h-10 cursor-pointer flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition"
//                 title="Notifications"
//               >
//                 <i className="bi bi-bell text-xl" />

//                 {unreadCount > 0 && (
//                   <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white">
//                     {unreadCount > 99 ? '99+' : unreadCount}
//                   </span>
//                 )}
//               </button>

//               {showNotifications && (
//                 <div className="absolute right-0 mt-2 w-[390px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999]">
//                   <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-gray-200">
//                     <div>
//                       <h3 className="font-bold text-slate-800">Notifications</h3>

//                       <p className="text-xs text-gray-500 mt-0.5">
//                         {unreadCount} unread notification
//                         {unreadCount === 1 ? '' : 's'}
//                       </p>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       {unreadCount > 0 && (
//                         <button
//                           type="button"
//                           onClick={markAllNotificationsRead}
//                           className="text-xs cursor-pointer font-semibold text-blue-500 hover:text-blue-700 transition"
//                         >
//                           Mark all read
//                         </button>
//                       )}

//                       {notificationList.length > 0 && (
//                         <button
//                           type="button"
//                           onClick={clearAllNotifications}
//                           className="text-xs cursor-pointer font-semibold text-red-500 hover:text-red-700 transition"
//                         >
//                           Clear All
//                         </button>
//                       )}

//                       <button
//                         type="button"
//                         onClick={() => setShowNotifications(false)}
//                         className="w-8 h-8 flex cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
//                       >
//                         <i className="bi bi-x-lg" />
//                       </button>
//                     </div>
//                   </div>

//                   {notificationLoading && (
//                     <div className="py-14 text-center text-gray-500">
//                       <i className="bi bi-arrow-repeat inline-block animate-spin mr-2" />
//                       Loading notifications...
//                     </div>
//                   )}

//                   {!notificationLoading && notificationList.length === 0 && (
//                     <div className="py-14 px-5 text-center">
//                       <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
//                         <i className="bi bi-bell-slash text-xl" />
//                       </div>

//                       <p className="font-semibold text-slate-700 mt-3">
//                         No notifications
//                       </p>

//                       <p className="text-sm text-gray-500 mt-1">
//                         You're all caught up.
//                       </p>
//                     </div>
//                   )}

//                   {!notificationLoading && notificationList.length > 0 && (
//                     <div className="max-h-[420px] overflow-y-auto">
//                       {notificationList.map((notification) => (
//                         <div
//                           key={notification.id}
//                           className={`relative border-b border-gray-100 hover:bg-slate-50 transition ${
//                             notification.read ? 'bg-white' : 'bg-blue-50/70'
//                           }`}
//                         >
//                           <button
//                             type="button"
//                             onClick={() => openNotification(notification)}
//                             className="w-full cursor-pointer text-left px-4 py-4 pr-12"
//                           >
//                             <div className="flex items-start gap-3">
//                               <div
//                                 className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getNotificationIconClass(
//                                   notification.type,
//                                 )}`}
//                               >
//                                 <i
//                                   className={`bi ${getNotificationIcon(
//                                     notification.type,
//                                   )}`}
//                                 />
//                               </div>

//                               <div className="flex-1 min-w-0">
//                                 <div className="flex items-start justify-between gap-2">
//                                   <p className="text-sm font-semibold text-slate-800">
//                                     {notification.title}
//                                   </p>

//                                   {!notification.read && (
//                                     <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-600 shrink-0" />
//                                   )}
//                                 </div>

//                                 <p className="text-sm text-gray-600 mt-1 leading-5">
//                                   {notification.message}
//                                 </p>

//                                 <p className="text-xs text-gray-400 mt-2">
//                                   {formatNotificationDate(notification.createdAt)}
//                                 </p>
//                               </div>
//                             </div>
//                           </button>

//                           <button
//                             type="button"
//                             onClick={(event) =>
//                               deleteNotification(notification, event)
//                             }
//                             title="Delete Notification"
//                             className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
//                           >
//                             <i className="bi bi-trash" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             <button
//               type="button"
//               onClick={openPasswordModal}
//               className="w-10 cursor-pointer h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
//               title="Change Password"
//             >
//               <i className="bi bi-key text-lg" />
//             </button>

//             <div className="hidden md:flex items-center gap-3 px-3 py-2">
//               <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
//                 {(employeeName || userName || 'U').charAt(0)}
//               </div>

//               <div className="leading-tight">
//                 <p className="text-sm font-semibold text-slate-800">
//                   {userName || 'User'}
//                 </p>

//                 <p className="text-xs text-gray-500">{role}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {showPasswordModal && (
//         <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
//           <button
//             type="button"
//             aria-label="Close password modal"
//             onClick={closePasswordModal}
//             className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
//           />

//           <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
//             <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
//               <div className="flex items-center gap-3">
//                 <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
//                   <i className="bi bi-key-fill text-xl" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-bold text-slate-800">
//                     Change Password
//                   </h2>

//                   <p className="text-sm text-gray-500">
//                     Update your account password
//                   </p>
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 onClick={closePasswordModal}
//                 disabled={changingPassword}
//                 className="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500 disabled:cursor-not-allowed cursor-pointer"
//               >
//                 <i className="bi bi-x-lg" />
//               </button>
//             </div>

//             <div className="p-6 space-y-4">
//               <div>
//                 <label className="block text-sm font-semibold text-slate-600 mb-2">
//                   Current Password
//                 </label>

//                 <input
//                   type="password"
//                   value={currentPassword}
//                   onChange={(event) => setCurrentPassword(event.target.value)}
//                   placeholder="Enter current password"
//                   disabled={changingPassword}
//                   autoComplete="current-password"
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-600 mb-2">
//                   New Password
//                 </label>

//                 <input
//                   type="password"
//                   value={newPassword}
//                   onChange={(event) => setNewPassword(event.target.value)}
//                   placeholder="Enter new password"
//                   disabled={changingPassword}
//                   autoComplete="new-password"
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//                 />

//                 <p className="text-xs text-gray-400 mt-1">
//                   Minimum 8 characters
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-600 mb-2">
//                   Confirm Password
//                 </label>

//                 <input
//                   type="password"
//                   value={confirmPassword}
//                   onChange={(event) => setConfirmPassword(event.target.value)}
//                   placeholder="Confirm new password"
//                   disabled={changingPassword}
//                   autoComplete="new-password"
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//                 />
//               </div>

//               {newPassword && confirmPassword && (
//                 <div className="text-sm">
//                   {newPassword === confirmPassword ? (
//                     <span className="inline-flex items-center gap-1 text-green-600">
//                       <i className="bi bi-check-circle" />
//                       Passwords match
//                     </span>
//                   ) : (
//                     <span className="inline-flex items-center gap-1 text-red-600">
//                       <i className="bi bi-x-circle" />
//                       Passwords do not match
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
//               <button
//                 type="button"
//                 onClick={closePasswordModal}
//                 disabled={changingPassword}
//                 className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
//               >
//                 Cancel
//               </button>

//               <button
//                 type="button"
//                 onClick={changePassword}
//                 disabled={changingPassword}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium cursor-pointer"
//               >
//                 {changingPassword ? (
//                   <i className="bi bi-arrow-repeat animate-spin" />
//                 ) : (
//                   <i className="bi bi-check-lg" />
//                 )}

//                 {changingPassword ? 'Changing...' : 'Change Password'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import { auth, notifications } from "../api/services";

function getErrorMessage(error, fallback = "Something went wrong.") {
  if (typeof error?.response?.data === "string" && error.response.data.trim()) {
    return error.response.data;
  }

  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function getNotificationIcon(type) {
  switch (type) {
    case "LEAVE_APPLIED":
      return "bi-calendar-plus";

    case "LEAVE_APPROVED":
      return "bi-check-circle-fill";

    case "LEAVE_REJECTED":
      return "bi-x-circle-fill";

    case "SALARY_GENERATED":
      return "bi-wallet2";

    case "ACCOUNT_CREATED":
      return "bi-person-plus-fill";

    case "ACCOUNT_DISABLED":
      return "bi-person-slash";

    case "ACCOUNT_ENABLED":
      return "bi-person-check-fill";

    case "PASSWORD_RESET":
      return "bi-key-fill";

    default:
      return "bi-bell-fill";
  }
}

function getNotificationIconClass(type) {
  switch (type) {
    case "LEAVE_APPLIED":
      return "bg-blue-100 text-blue-600";

    case "LEAVE_APPROVED":
      return "bg-green-100 text-green-600";

    case "LEAVE_REJECTED":
      return "bg-red-100 text-red-600";

    case "SALARY_GENERATED":
      return "bg-purple-100 text-purple-600";

    case "ACCOUNT_CREATED":
      return "bg-indigo-100 text-indigo-600";

    case "ACCOUNT_DISABLED":
      return "bg-red-100 text-red-600";

    case "ACCOUNT_ENABLED":
      return "bg-green-100 text-green-600";

    case "PASSWORD_RESET":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

function formatNotificationDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function Navbar({ onLogout, onMenuClick }) {
  const navigate = useNavigate();

  const notificationBoxRef = useRef(null);

  const role = localStorage.getItem("role") || "";

  const userName = localStorage.getItem("userName") || "";

  const employeeName = localStorage.getItem("employeeName") || "";

  const [showNotifications, setShowNotifications] = useState(false);

  const [notificationList, setNotificationList] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationLoading, setNotificationLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);

  const todayText = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const displayName = employeeName || userName || "User";

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notifications.count();

      setUnreadCount(response?.data?.unreadCount || 0);
    } catch (error) {
      console.error("Unread notification count error:", error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationLoading(true);

    try {
      const response = await notifications.all();

      setNotificationList(response?.data || []);
    } catch (error) {
      console.error("Notification loading error:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();

    const pollingId = window.setInterval(() => {
      loadUnreadCount();

      if (showNotifications) {
        loadNotifications();
      }
    }, 100000);

    return () => {
      window.clearInterval(pollingId);
    };
  }, [loadNotifications, loadUnreadCount, showNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        showNotifications &&
        notificationBoxRef.current &&
        !notificationBoxRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showNotifications]);

  const toggleNotifications = async () => {
    const next = !showNotifications;

    setShowNotifications(next);

    if (next) {
      await loadNotifications();
    }
  };

  const navigateForNotification = (notification) => {
    setShowNotifications(false);

    switch (notification.type) {
      case "LEAVE_APPLIED":
      case "LEAVE_APPROVED":
      case "LEAVE_REJECTED":
        navigate("/leaves");
        break;

      case "SALARY_GENERATED":
        navigate("/salary");
        break;

      case "ACCOUNT_CREATED":
      case "PASSWORD_RESET":
      case "ACCOUNT_ENABLED":
      case "ACCOUNT_DISABLED":
        navigate(role === "ADMIN" ? "/employees" : "/dashboard");
        break;

      default:
        navigate("/dashboard");
    }
  };

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await notifications.read(notification.id);

        setNotificationList((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  read: true,
                }
              : item,
          ),
        );

        setUnreadCount((count) => Math.max(count - 1, 0));
      } catch (error) {
        console.error("Unable to mark notification as read:", error);
      }
    }

    navigateForNotification(notification);
  };

  const markAllNotificationsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await notifications.readAll();

      setNotificationList((current) =>
        current.map((item) => ({
          ...item,
          read: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Unable to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (notification, event) => {
    event.stopPropagation();

    try {
      await notifications.remove(notification.id);

      setNotificationList((current) =>
        current.filter((item) => item.id !== notification.id),
      );

      if (!notification.read) {
        setUnreadCount((count) => Math.max(count - 1, 0));
      }
    } catch (error) {
      console.error("Delete notification error:", error);

      Swal.fire("Error", "Unable to delete notification.", "error");
    }
  };

  const clearAllNotifications = async () => {
    if (notificationList.length === 0) {
      return;
    }

    const result = await Swal.fire({
      title: "Clear Notifications?",
      text: "All notifications will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Clear All",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await notifications.clear();

      setNotificationList([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Clear notifications error:", error);

      Swal.fire("Error", "Unable to clear notifications.", "error");
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowNotifications(false);

    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (changingPassword) {
      return;
    }

    setShowPasswordModal(false);
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire(
        "Missing Fields",
        "Please fill all password fields.",
        "warning",
      );

      return;
    }

    if (newPassword.length < 8) {
      Swal.fire(
        "Invalid Password",
        "New password must be at least 8 characters.",
        "warning",
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire(
        "Password Mismatch",
        "New password and confirm password do not match.",
        "warning",
      );

      return;
    }

    if (currentPassword === newPassword) {
      Swal.fire(
        "Same Password",
        "New password must be different from your current password.",
        "warning",
      );

      return;
    }

    setChangingPassword(true);

    try {
      const response = await auth.changePassword({
        currentPassword,
        newPassword,
      });

      setShowPasswordModal(false);

      const successMessage =
        typeof response?.data === "string"
          ? response.data
          : response?.data?.message ||
            "Your password has been changed successfully. Please login again.";

      await Swal.fire({
        icon: "success",
        title: "Password Changed",
        text: successMessage,
        confirmButtonText: "Login Again",
      });

      if (onLogout) {
        onLogout();
      } else {
        localStorage.clear();

        navigate("/login", {
          replace: true,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to Change Password",
        text: getErrorMessage(error),
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <nav className="w-full shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              title="Open Menu"
              className="
                flex lg:hidden
                h-10 w-10 shrink-0
                cursor-pointer
                items-center justify-center
                rounded-lg
                text-slate-600
                transition
                hover:bg-slate-100
                hover:text-slate-900
              "
            >
              <i className="bi bi-list text-2xl" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-800 sm:text-lg">
                Employee Management System
              </h1>

              <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                {todayText}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div ref={notificationBoxRef} className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className="
                  relative
                  flex h-10 w-10
                  cursor-pointer
                  items-center justify-center
                  rounded-lg
                  text-slate-600
                  transition
                  hover:bg-slate-100
                  hover:text-slate-900
                "
                title="Notifications"
              >
                <i className="bi bi-bell text-xl" />

                {unreadCount > 0 && (
                  <span
                    className="
                      absolute -right-1 -top-1
                      flex h-5 min-w-5
                      items-center justify-center
                      rounded-full
                      border-2 border-white
                      bg-red-500
                      px-1
                      text-[10px]
                      font-bold
                      text-white
                    "
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="
                    absolute right-0 top-full
                    z-[9999]
                    mt-2
                    w-[390px]
                    max-w-[calc(100vw-1rem)]
                    overflow-hidden
                    rounded-xl
                    border border-gray-200
                    bg-white
                    shadow-2xl
                  "
                >
                  <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-4">
                    <div>
                      <h3 className="font-bold text-slate-800">
                        Notifications
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {unreadCount} unread notification
                        {unreadCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="cursor-pointer whitespace-nowrap px-2 py-1 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                        >
                          Mark all read
                        </button>
                      )}

                      {notificationList.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllNotifications}
                          className="cursor-pointer whitespace-nowrap px-2 py-1 text-xs font-semibold text-red-500 transition hover:text-red-700"
                        >
                          Clear All
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="
                          flex h-8 w-8
                          cursor-pointer
                          items-center justify-center
                          rounded-lg
                          text-gray-500
                          transition
                          hover:bg-gray-100
                        "
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </div>

                  {notificationLoading && (
                    <div className="py-14 text-center text-gray-500">
                      <i className="bi bi-arrow-repeat mr-2 inline-block animate-spin" />
                      Loading notifications...
                    </div>
                  )}

                  {!notificationLoading && notificationList.length === 0 && (
                    <div className="px-5 py-14 text-center">
                      <div
                        className="
                            mx-auto
                            flex h-12 w-12
                            items-center justify-center
                            rounded-full
                            bg-gray-100
                            text-gray-400
                          "
                      >
                        <i className="bi bi-bell-slash text-xl" />
                      </div>

                      <p className="mt-3 font-semibold text-slate-700">
                        No notifications
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        You're all caught up.
                      </p>
                    </div>
                  )}

                  {!notificationLoading && notificationList.length > 0 && (
                    <div className="max-h-[420px] overflow-y-auto">
                      {notificationList.map((notification) => (
                        <div
                          key={notification.id}
                          className={`
                                relative
                                border-b border-gray-100
                                transition
                                hover:bg-slate-50

                                ${
                                  notification.read
                                    ? "bg-white"
                                    : "bg-blue-50/70"
                                }
                              `}
                        >
                          <button
                            type="button"
                            onClick={() => openNotification(notification)}
                            className="
                                  w-full
                                  cursor-pointer
                                  px-4 py-4 pr-12
                                  text-left
                                "
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`
                                      flex h-10 w-10 shrink-0
                                      items-center justify-center
                                      rounded-full
                                      ${getNotificationIconClass(
                                        notification.type,
                                      )}
                                    `}
                              >
                                <i
                                  className={`bi ${getNotificationIcon(
                                    notification.type,
                                  )}`}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {notification.title}
                                  </p>

                                  {!notification.read && (
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                  )}
                                </div>

                                <p className="mt-1 text-sm leading-5 text-gray-600">
                                  {notification.message}
                                </p>

                                <p className="mt-2 text-xs text-gray-400">
                                  {formatNotificationDate(
                                    notification.createdAt,
                                  )}
                                </p>
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={(event) =>
                              deleteNotification(notification, event)
                            }
                            title="Delete Notification"
                            className="
                                  absolute right-3 top-3
                                  flex h-8 w-8
                                  cursor-pointer
                                  items-center justify-center
                                  rounded-lg
                                  text-gray-400
                                  transition
                                  hover:bg-red-50
                                  hover:text-red-600
                                "
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openPasswordModal}
              className="
                flex h-10 w-10
                cursor-pointer
                items-center justify-center
                rounded-lg
                text-slate-600
                transition
                hover:bg-blue-50
                hover:text-blue-600
              "
              title="Change Password"
            >
              <i className="bi bi-key text-lg" />
            </button>

            <div className="hidden items-center gap-3 border-l border-gray-200 pl-3 md:flex">
              <div
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  bg-blue-100
                  font-bold
                  text-blue-700
                "
              >
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="max-w-[160px] leading-tight">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {displayName}
                </p>

                <p className="text-xs text-gray-500">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {showPasswordModal && (
        <div
          className="
            fixed inset-0
            z-[10000]
            flex items-center justify-center
            p-4
          "
        >
          <button
            type="button"
            aria-label="Close password modal"
            onClick={closePasswordModal}
            className="
              absolute inset-0
              cursor-default
              bg-black/50
              backdrop-blur-sm
            "
          />

          <div
            className="
              relative
              w-full max-w-md
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-blue-100
                    text-blue-600
                  "
                >
                  <i className="bi bi-key-fill text-xl" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Change Password
                  </h2>

                  <p className="text-sm text-gray-500">
                    Update your account password
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className="
                  flex h-9 w-9
                  cursor-pointer
                  items-center justify-center
                  rounded-lg
                  text-gray-500
                  transition
                  hover:bg-gray-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Current Password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Enter current password"
                  disabled={changingPassword}
                  autoComplete="current-password"
                  className="
                    w-full
                    rounded-lg
                    border border-gray-300
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:bg-gray-100
                  "
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                  disabled={changingPassword}
                  autoComplete="new-password"
                  className="
                    w-full
                    rounded-lg
                    border border-gray-300
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:bg-gray-100
                  "
                />

                <p className="mt-1 text-xs text-gray-400">
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  disabled={changingPassword}
                  autoComplete="new-password"
                  className="
                    w-full
                    rounded-lg
                    border border-gray-300
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:bg-gray-100
                  "
                />
              </div>

              {newPassword && confirmPassword && (
                <div className="text-sm">
                  {newPassword === confirmPassword ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <i className="bi bi-check-circle" />
                      Passwords match
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <i className="bi bi-x-circle" />
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className="
                  cursor-pointer
                  rounded-lg
                  border border-gray-300
                  px-5 py-2.5
                  text-gray-700
                  transition
                  hover:bg-gray-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={changePassword}
                disabled={changingPassword}
                className="
                  inline-flex
                  cursor-pointer
                  items-center gap-2
                  rounded-lg
                  bg-blue-600
                  px-5 py-2.5
                  font-medium
                  text-white
                  transition
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:bg-blue-300
                "
              >
                {changingPassword ? (
                  <i className="bi bi-arrow-repeat animate-spin" />
                ) : (
                  <i className="bi bi-check-lg" />
                )}

                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
