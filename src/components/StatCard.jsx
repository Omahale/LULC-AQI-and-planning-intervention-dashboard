import {
  Activity,
  Wind,
  Cloud,
  Flame,
} from "lucide-react";

const icons = {
  activity: Activity,
  wind: Wind,
  cloud: Cloud,
  flame: Flame,
};

function StatCard({
  title,
  value,
  unit,
  status,
  icon,
}) {
  const Icon = icons[icon] || Activity;

  return (
    <div className="stat-card">

      <div className="stat-card-top">

        <div className="stat-icon">
          <Icon size={20} />
        </div>

        <span className="stat-status">
          {status}
        </span>

      </div>

      <div className="stat-value">
        {value}

        <small>
          {unit}
        </small>
      </div>

      <p>
        {title}
      </p>

    </div>
  );
}

export default StatCard;