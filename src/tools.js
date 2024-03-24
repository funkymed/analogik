import {
  isDesktop,
  isMobile,
  isMobileOnly,
  isTablet,
} from "react-device-detect";

export const deepMergeObjects = (obj1, obj2) => {
  for (const key in obj1) {
    if (obj1.hasOwnProperty(key)) {
      if (typeof obj1[key] === "object") {
        if (typeof obj2[key] !== "object" || Array.isArray(obj2[key])) {
          obj2[key] = Array.isArray(obj1[key]) ? [] : {};
        }
        deepMergeObjects(obj1[key], obj2[key]);
      } else {
        obj2[key] = obj1[key];
      }
    }
  }
};

export const getRandomOffset = (arr, current) => {
  const off = Math.floor(Math.random() * arr.length);
  return off !== current ? off : getRandomOffset(arr, current);
};

export const getRandomItem = (arr) => {
  return arr[getRandomOffset(arr, -1)];
};

export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const updateRouteHttp = (
  year,
  author,
  selection,
  pos,
  newconfigOffset
) => {
  var url = new URL(window.location.origin);
  var search_params = url.searchParams;
  if (year) {
    search_params.append("year", year);
  }
  if (author) {
    search_params.append("author", author);
  }
  if (selection !== "all") {
    search_params.append("selection", selection);
  }
  if (pos) {
    search_params.append("track", pos);
  }
  if (newconfigOffset) {
    search_params.append("config", newconfigOffset);
  }
  url.search = search_params.toString();
  window.history.pushState(null, null, `?${search_params.toString()}`);
};
