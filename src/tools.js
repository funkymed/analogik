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
