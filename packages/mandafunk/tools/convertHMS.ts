/**
 * Converts a time value in seconds to a MM:SS formatted string.
 *
 * @param value - Time in seconds (can be a number or numeric string)
 * @returns Formatted time string in MM:SS format
 */
export const convertHMS = function (value: number | string): string {
  const sec = parseInt(String(value), 10);
  let hours: number | string = Math.floor(sec / 3600);
  let minutes: number | string = Math.floor((sec - (hours as number) * 3600) / 60);
  let seconds: number | string =
    sec - (hours as number) * 3600 - (minutes as number) * 60;

  if ((hours as number) < 10) {
    hours = "0" + hours;
  }
  if ((minutes as number) < 10) {
    minutes = "0" + minutes;
  }
  if ((seconds as number) < 10) {
    seconds = "0" + seconds;
  }
  minutes = isNaN(minutes as number) ? "00" : minutes;
  seconds = isNaN(seconds as number) ? "00" : seconds;
  return minutes + ":" + seconds;
};
