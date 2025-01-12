import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiClock } from "react-icons/fi";
import { GiKnifeFork } from "react-icons/gi";
import { FaToilet, FaPray } from "react-icons/fa";
import { Scanner } from "@yudiel/react-qr-scanner";
import Message from "./components/Message";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [employeeName, setEmployeeName] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [breaks, setBreaks] = useState(null);
  const [breakType, setBreakType] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState({ type: null, text: "" });

  const API_URL = "https://aoncodev.work.gd";

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: null, text: "" });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogin = async (result) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        qr_id: result[0].rawValue,
      });

      const { id, name, role } = response.data;

      const res = await axios.get(`${API_URL}/employee/status/${id}`);
      const employeeStatus = res.data;

      setAttendance(employeeStatus.attendance);
      setBreaks(employeeStatus.breaks);
      setEmployeeId(id);
      setEmployeeName(name);
      setIsLoggedIn(true);

      if (
        employeeStatus.attendance?.clock_in &&
        !employeeStatus.attendance?.clock_out
      ) {
        setStatus("clocked_in");
      } else if (
        employeeStatus.attendance?.clock_in &&
        employeeStatus.attendance?.clock_out
      ) {
        setStatus("shift_over");
        setTimeout(() => {
          handleLogout();
        }, 4000);
      } else {
        setStatus("clocked_out");
      }

      if (employeeStatus.breaks && employeeStatus.breaks.length > 0) {
        const lastBreak =
          employeeStatus.breaks[employeeStatus.breaks.length - 1];
        if (!lastBreak.break_end) {
          setBreakType(lastBreak.break_type);
        } else {
          setBreakType(null);
        }
      }

      setMessage({ type: "success", text: `Welcome, ${name} (${role})!` });
    } catch (error) {
      console.error("Login error:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.detail || "Failed to log in. Please try again.",
      });
    }
  };

  const handleClockIn = async () => {
    try {
      await axios.post(`${API_URL}/clock-in`, null, {
        params: { employee_id: employeeId },
      });
      setMessage({ type: "success", text: "Clocked in successfully!" });
      setTimeout(() => {
        handleLogout();
      }, 1000);
    } catch (error) {
      console.error("Clock-in error:", error);
      setMessage({
        type: "error",
        text: "Failed to clock in. Please try again.",
      });
    }
  };

  const handleClockOut = async () => {
    try {
      await axios.post(`${API_URL}/clock-out`, null, {
        params: { employee_id: employeeId },
      });
      setMessage({ type: "success", text: "Clocked out successfully!" });
      setTimeout(() => {
        handleLogout();
      }, 1000);
    } catch (error) {
      console.error("Clock-out error:", error);
      setMessage({
        type: "error",
        text: "Failed to clock out. Please try again.",
      });
    }
  };

  const handleBreakStart = async (type) => {
    try {
      await axios.post(`${API_URL}/breaks/start/`, {
        attendance_id: attendance.id,
        break_type: type,
      });
      setMessage({ type: "success", text: `Started ${type} break!` });
      setTimeout(() => {
        handleLogout();
      }, 1000);
    } catch (error) {
      console.error("Break start error:", error);
      setMessage({
        type: "error",
        text: "Failed to start break. Please try again.",
      });
    }
  };

  const handleBreakEnd = async () => {
    try {
      await axios.post(`${API_URL}/breaks/end/`, {
        attendance_id: attendance.id,
      });
      setMessage({ type: "success", text: "Break ended!" });
      setTimeout(() => {
        handleLogout();
      }, 1000);
    } catch (error) {
      console.error("Break end error:", error);
      setMessage({
        type: "error",
        text: "Failed to end break. Please try again.",
      });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmployeeName("");
    setAttendance(null);
    setBreaks(null);
    setBreakType(null);
    setEmployeeId(null);
    setStatus("");
    setQrResult(null);
    setMessage({ type: null, text: "" });
  };

  return (
    <div className="min-h-screen bg-white">
      {isLoggedIn ? (
        <div className="p-4">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  Welcome, {employeeName}
                </h1>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Logout
                </button>
              </div>
              {message.text && (
                <Message type={message.type} message={message.text} />
              )}
              {status === "shift_over" && (
                <p className="text-green-500 font-bold text-lg mb-4">
                  Shift over for today
                </p>
              )}

              {status !== "shift_over" && (
                <div className="mb-8">
                  <button
                    onClick={
                      status === "clocked_in" ? handleClockOut : handleClockIn
                    }
                    className={`w-full ${
                      status === "clocked_in"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center text-lg transition-colors duration-300`}
                    disabled={message.type === "success"}
                  >
                    <FiClock className="mr-2" />
                    {status === "clocked_in" ? "Clock Out" : "Clock In"}
                  </button>
                </div>
              )}

              {status !== "shift_over" && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Break Options
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { type: "eating", icon: GiKnifeFork, label: "Eating" },
                      { type: "restroom", icon: FaToilet, label: "Restroom" },
                      { type: "praying", icon: FaPray, label: "Praying" },
                    ].map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() =>
                          breakType === type
                            ? handleBreakEnd()
                            : handleBreakStart(type)
                        }
                        className={`p-4 rounded-lg flex flex-col items-center justify-center transition-colors duration-300 ${
                          breakType === type
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                        disabled={message.type === "success"}
                      >
                        <Icon className="text-3xl mb-2" />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {breakType && (
                <div className="text-center text-lg font-semibold text-blue-600">
                  On {breakType} break
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
            <h1 className="mb-6 text-3xl font-bold text-center text-gray-800">
              Employee Login
            </h1>
            {message.text && (
              <Message type={message.type} message={message.text} />
            )}
            <div className="relative w-full aspect-square mx-auto mb-6 overflow-hidden rounded-lg shadow-inner bg-gray-100">
              <Scanner
                onScan={(result) => handleLogin(result)}
                onError={(error) => console.error("QR Scan Error:", error)}
                styles={{
                  video: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  },
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-3/4 border-2 border-blue-500 border-opacity-50 rounded-lg"></div>
              </div>
            </div>
            {qrResult ? (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-center text-blue-800">
                  QR Code scanned successfully! Logging in...
                </p>
              </div>
            ) : (
              <p className="text-sm text-center text-gray-600">
                Position the QR code within the frame to scan
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
