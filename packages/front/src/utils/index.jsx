import { reject } from "lodash";

export function coalesce(list) {
    return list.find(text => !!text);
}

export const yearsFromBeggining = Array.apply(null, Array((new Date().getFullYear()+1 - 2014))).map((_, idx) => 2014 + idx);

export const secureFindIndex = (arr, value, idx) => {
    if(!arr) return null;

    const find = arr.find(([key]) => key === value)
    if(!!find) return find[idx];

    return null;
}

export async function copyToClipboard(text) {
  return new Promise((resolver, reject)=>{
    navigator.clipboard.writeText(text)
      .then(resolver)
      .catch(reject)
  })
}