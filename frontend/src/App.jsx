import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import PrivateRoute from "./Components/PrivateRoute/PrivateRoute.jsx";
import MasterRoute from "./Components/PrivateRoute/MasterRoute.jsx";
import Spinner from "./Components/Spinner/Spinner";
import Admin from "./Components/Admin/Admin";
import Login from "./Components/Login/Login";
import ResetPassword from "./Components/ForgetPassword/ResetPassword";
import { useSnackbar } from "notistack";
import PayslipTemplateComponent from "./Components/Qrs/PaySlip/Components/PayslipTemplateComponent";
import { apiEndPoint } from "./Service/ApiConstant";
import Controller from "./Service/ApiController";

import EsignTC from "./Lib/EsignTC";
import AjmInsurance from "./Components/Ajm/AjmInsurance/AjmInsurance";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/otp" element={<DynamicOtp />} />
        <Route path="/master/:role/settings" element={<AdminWithRoleCheck />} />
        <Route path="/" element={<Login />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/esign_terms" element={<EsignTC />} />
        <Route path="/result/:feild/:template" element={<DynamicResult />} />
        <Route
          path="/Qrs/PayslipGenerator"
          element={<PayslipTemplateComponent />}
        />
        <Route path="/ajm_insurance" element={<AjmInsurance />} />

        <Route
          path="/messagedetail/:action/:template/:uid"
          element={
            <PrivateRoute redirectToPath="/otp">
              <DynamicMain />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

const AdminWithRoleCheck = () => {
  const [userRole, setUserRole] = useState(null);
  const uid = sessionStorage.getItem("userUid");
  const token = sessionStorage.getItem("token");
  const email = sessionStorage.getItem("email_id");
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchAction = async () => {
      try {
        const result = await Controller.ApiController(
          "",
          apiEndPoint.USER_ROLE_FETCHER + uid,
          "GET",
          {
            params: {},
          }
        );
        if (result.success === true) {
          const { email_id, user_name, user_uid } = result.data;
          sessionStorage.setItem("email_id", email_id);
          sessionStorage.setItem("UserName", user_name);
          sessionStorage.setItem("userUid", user_uid);
          const companyLevelPermissions =
            result.data.company_level_permissions || [];
          const firstPermission =
            companyLevelPermissions.length > 0
              ? companyLevelPermissions[0]
              : null;
          setUserRole(firstPermission);
          sessionStorage.setItem("Role", firstPermission);
        } else {
          enqueueSnackbar(`${result.data}`, {
            variant: "error",
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
          });
        }
      } catch (error) {
        console.log(" App.js", error);
      }
    };

    if (token) {
      fetchAction();
    }
  }, [uid, token, email]);

  if (token && userRole === null) {
    return navigate("/");
  }

  return (
    <MasterRoute redirectToPath="/">
      <Admin role={userRole} />
    </MasterRoute>
  );
};

const DynamicMain = () => {
  const Tempname = sessionStorage.getItem("TempName");
  const TemplateComponent = lazy(() =>
    import(`./Components/${Tempname}/${Tempname}.jsx`)
  );
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TemplateComponent />
    </Suspense>
  );
};

const DynamicOtp = () => {
  const Tempname = sessionStorage.getItem("TempName");
  const TemplateComponent = lazy(() =>
    import(`./Components/${Tempname}Otp/${Tempname}Otp.jsx`)
  );

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TemplateComponent />
    </Suspense>
  );
};

const DynamicResult = () => {
  const Tempname = sessionStorage.getItem("TempName");
  const TemplateComponent = lazy(() =>
    import(`./Components/${Tempname}Result/${Tempname}Result.jsx`)
  );

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TemplateComponent />
    </Suspense>
  );
};

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <Spinner />
  </div>
);

export default App;
