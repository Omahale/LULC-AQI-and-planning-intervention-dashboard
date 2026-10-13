import os
import tempfile
import unittest

from services.aqi_service import load_station_csv_data


class AqiCsvDatasetTests(unittest.TestCase):
    def test_load_station_csv_data_reads_stationwise_rows(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = os.path.join(tmpdir, "nashik_aqi_8h.csv")
            with open(csv_path, "w", encoding="utf-8") as handle:
                handle.write(
                    "station_id,station_name,lat,lon,timestamp,pm25,pm10,no2\n"
                    "S1,Satpur,20.01,73.78,2026-10-08 10:00:00,45,90,28\n"
                    "S2,College Road,20.02,73.79,2026-10-08 10:00:00,55,95,32\n"
                )

            rows = load_station_csv_data(tmpdir)

            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]["station_id"], "S1")
            self.assertEqual(rows[0]["pm25"], 45)
            self.assertEqual(rows[1]["station_name"], "College Road")

    def test_load_station_csv_data_handles_real_nashik_file_format(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = os.path.join(tmpdir, "Raw_Data_2026_site_304_gangapur_road_nashik_mpcb_1Hr.csv")
            with open(csv_path, "w", encoding="utf-8") as handle:
                handle.write(
                    "Timestamp,PM2.5 (µg/m³),PM10 (µg/m³),NO2 (µg/m³),SO2 (µg/m³),CO (mg/m³)\n"
                    "2026-01-01 00:00:00,44.25,80.5,3.0,3.0,0.0\n"
                    "2026-01-01 01:00:00,45.25,84.75,3.0,3.25,0.0\n"
                )

            rows = load_station_csv_data(tmpdir)

            self.assertGreater(len(rows), 0)
            self.assertEqual(rows[0]["station_id"], "304")
            self.assertEqual(rows[0]["station_name"], "Gangapur Road")
            self.assertEqual(rows[0]["pm25"], 44)
            self.assertEqual(rows[0]["pm10"], 80)
            self.assertAlmostEqual(rows[0]["latitude"], 20.0043, places=4)
            self.assertAlmostEqual(rows[0]["longitude"], 73.7886, places=4)


if __name__ == "__main__":
    unittest.main()
