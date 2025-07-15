import os
from datetime import datetime, timedelta
from app.services import exif_service
from app.metadata_schema import TAG_MAP

# The format string used by ExifTool for DateTimeOriginal
EXIF_DATE_FORMAT = "%Y:%m:%d %H:%M:%S"


class TimeShiftService:
    def _get_time_shift_delta(self, shift_data: dict) -> timedelta:
        """Converts the shift data from the request into a timedelta object."""
        direction = -1 if shift_data.get("direction") == "subtract" else 1
        return timedelta(
            days=int(shift_data.get("days", 0)) * direction,
            hours=int(shift_data.get("hours", 0)) * direction,
            minutes=int(shift_data.get("minutes", 0)) * direction,
            seconds=int(shift_data.get("seconds", 0)) * direction,
        )

    def get_shift_preview(self, file_paths: list[str], shift_data: dict) -> list[dict]:
        """Calculates the new timestamps for a list of files without saving."""
        if not file_paths:
            return []

        shift_delta = self._get_time_shift_delta(shift_data)
        previews = []
        all_metadata = exif_service.read_metadata_for_files(file_paths)

        for metadata in all_metadata:
            original_time_str = metadata.get("DateTimeOriginal", {}).get("value")
            filename = os.path.basename(metadata.get("SourceFile", "Unknown"))

            if not original_time_str:
                previews.append(
                    {"filename": filename, "original": "Not Found", "new": "N/A"}
                )
                continue

            try:
                original_dt = datetime.strptime(original_time_str, EXIF_DATE_FORMAT)
                new_dt = original_dt + shift_delta
                new_time_str = new_dt.strftime(EXIF_DATE_FORMAT)
                previews.append(
                    {
                        "filename": filename,
                        "original": original_time_str,
                        "new": new_time_str,
                    }
                )
            except (ValueError, TypeError):
                previews.append(
                    {
                        "filename": filename,
                        "original": original_time_str,
                        "new": "Invalid Format",
                    }
                )

        return previews

    def apply_shift(self, file_paths: list[str], shift_data: dict) -> bool:
        """Applies the time shift to the metadata of the files."""
        if not file_paths:
            return False

        shift_delta = self._get_time_shift_delta(shift_data)
        all_metadata = exif_service.read_metadata_for_files(file_paths)

        for metadata in all_metadata:
            source_file = metadata.get("SourceFile")
            original_time_str = metadata.get("DateTimeOriginal", {}).get("value")

            if not source_file or not original_time_str:
                continue

            try:
                original_dt = datetime.strptime(original_time_str, EXIF_DATE_FORMAT)
                new_dt = original_dt + shift_delta
                new_time_str = new_dt.strftime(EXIF_DATE_FORMAT)

                # Prepare payload to update the DateTimeOriginal field. The exif_service
                # will handle writing it to all necessary source tags.
                update_payload = {"DateTimeOriginal": new_time_str}

                # We pass an empty dict for original_metadata because for this specific, targeted
                # update, we don't need to check for existing tags; we just overwrite.
                args = exif_service.build_exiftool_args({}, update_payload)
                if args:
                    exif_service.run_exiftool_command(args + [source_file])
            except (ValueError, TypeError):
                # Skip files with invalid date formats
                continue

        return True


time_shift_service = TimeShiftService()
