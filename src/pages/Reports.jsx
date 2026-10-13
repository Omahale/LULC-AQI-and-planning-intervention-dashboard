import {
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";

import { alerts } from "../data/dummyData";

const icons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

function Alerts() {
  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            MONITORING CENTER
          </p>

          <h1>Alerts & Notifications</h1>

          <p>
            Environmental events requiring attention.
          </p>
        </div>
      </div>

      <div className="alerts-list">

        {alerts.map(
          (alert, index) => {

            const Icon = icons[alert.type];

            return (
              <div
                className={`alert-card ${alert.type}`}
                key={index}
              >

                <div className="alert-icon">
                  <Icon size={23} />
                </div>

                <div className="alert-content">

                  <h3>
                    {alert.title}
                  </h3>

                  <p>
                    {alert.description}
                  </p>

                  <span>
                    {alert.time}
                  </span>

                </div>

                <button className="dismiss-button">
                  View
                </button>

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}

export default Alerts;