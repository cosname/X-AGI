// Reviewed framing in original-image coordinates. See docs/portrait-framing.md.
// Negative crop coordinates are allowed only for portraits with a plain white backdrop.
type PortraitCrop = {
  width: number;
  height: number;
  x: number;
  y: number;
  size: number;
  background?: string;
};
const circularPortraitCrops: Readonly<Record<string, PortraitCrop>> = {
  'liu-zequn': { width: 2217, height: 2956, x: 0, y: 270, size: 2217 },
  'liu-ziyin': { width: 256, height: 318, x: 0, y: 24, size: 256 },
  'liu-jun': { width: 418, height: 520, x: 0, y: 38, size: 418 },
  'sun-maosong': { width: 302, height: 384, x: 0, y: 33, size: 302 },
  'feng-jianfeng': { width: 1080, height: 1616, x: 150, y: 110, size: 687 },
  'qiu-zihan': { width: 2880, height: 2880, x: 333, y: 60, size: 2200, background: '#fff' },
  'wang-jianqiao': { width: 1239, height: 1239, x: -20, y: 0, size: 1239, background: '#fff' },
  'luo-tao': { width: 1800, height: 2704, x: 0, y: 70, size: 1800 },
  'liu-fanghui': { width: 4698, height: 5459, x: 604, y: 495, size: 4094 },
  'zou-difan': { width: 1280, height: 1280, x: 60, y: 0, size: 1160 },
  'pan-liangming': { width: 354, height: 354, x: 0, y: 0, size: 350 },
  'zhang-huishuai': { width: 308, height: 394, x: -41, y: 0, size: 390, background: '#fff' },
  'shen-hao': { width: 1280, height: 1706, x: 381, y: 487, size: 320 },
  'zhang-huaqing': { width: 1162, height: 1162, x: 234, y: 293, size: 610 },
  'zhang-xianyi': { width: 2232, height: 2627, x: 282, y: 693, size: 1244 },
  'zhang-huafeng': { width: 1078, height: 1079, x: 199, y: 380, size: 480 },
  'li-xiuhong': { width: 3066, height: 4598, x: 680, y: 205, size: 1750 },
  'wu-chenwei': { width: 2400, height: 3600, x: 451, y: 245, size: 1546 },
  'yang-pengkun': { width: 769, height: 1155, x: 49, y: 56, size: 665 },
  'yuan-zhang': { width: 1931, height: 2270, x: 0, y: 272, size: 1931 },
  'han-jiale': { width: 413, height: 579, x: -67, y: 0, size: 560, background: '#fff' },
  'luyao-zhang': { width: 768, height: 768, x: 84, y: 40, size: 675 },
  'huang-ruizhao': { width: 1106, height: 1422, x: -144, y: 0, size: 1390, background: '#fff' },
  'zhou-mo': { width: 1280, height: 1894, x: 0, y: 142, size: 1280 },
  'shi-zuoqiang': { width: 728, height: 977, x: 0, y: 66, size: 728 },
  'jiao-yuling': { width: 940, height: 950, x: 0, y: 10, size: 940 },
  'lu-yiping': { width: 1122, height: 1402, x: -4, y: 205, size: 1126, background: '#fff' },
  'zhou-peijie': { width: 1430, height: 1818, x: 161, y: 193, size: 1100 },
  'chen-siming': { width: 1080, height: 1616, x: 52, y: 81, size: 1003 },
  'tu-shangqing': { width: 1205, height: 1205, x: -5, y: 0, size: 1205, background: '#fff' },
  'chen-qing': { width: 1086, height: 1086, x: 0, y: 0, size: 1086 },
  'huang-pei': { width: 2448, height: 1632, x: 719, y: 61, size: 949 },
  'li-qiuyi': { width: 1080, height: 1080, x: 327, y: 196, size: 419 },
  'xu-huinan': { width: 2193, height: 3069, x: -339, y: 122, size: 2873, background: '#fff' },
  'xie-chao': { width: 500, height: 696, x: 0, y: 73, size: 500 },
  'wu-tailin': { width: 640, height: 768, x: 95, y: 52, size: 462, background: '#fff' },
  'zhao-peng': { width: 394, height: 464, x: -25, y: 36, size: 426, background: '#fff' },
  'ma-jianhao': { width: 3024, height: 4032, x: 375, y: 971, size: 2221 },
  'chang-heng': { width: 3604, height: 3604, x: 281, y: 289, size: 3300 },
  'ma-ziye': { width: 412, height: 350, x: 71, y: 54, size: 276 },
  'liu-ziming': { width: 2022, height: 1720, x: 488, y: 127, size: 1050 },
  'zhang-yaoyu': { width: 3024, height: 4032, x: 601, y: 896, size: 1729 },
  'liu-weiyang': { width: 270, height: 300, x: 9, y: 16, size: 252 },
  'luo-weijian': { width: 4032, height: 3024, x: 905, y: 784, size: 2240 },
  'li-gen': { width: 400, height: 400, x: 35, y: 30, size: 333 },
  'cao-yuan': { width: 413, height: 579, x: -74, y: 34, size: 545, background: '#fff' },
  'hu-tianyang': { width: 710, height: 712, x: 0, y: 0, size: 710 },
  'mao-xiaojie': { width: 2735, height: 4103, x: 29, y: 306, size: 2566 },
  'ma-junjie': { width: 1784, height: 2150, x: 93, y: 62, size: 1611 },
  'zhou-feng': { width: 292, height: 418, x: -57, y: 13, size: 406, background: '#fff' },
  'zhou-fan': { width: 1280, height: 1280, x: 164, y: 43, size: 950, background: '#fff' },
  'xu-hongteng': { width: 300, height: 300, x: 16, y: 16, size: 284 },
  'cong-xin': { width: 413, height: 579, x: -79, y: 9, size: 570, background: '#fff' },
  'li-peng': { width: 1280, height: 1920, x: 270, y: 84, size: 830 },
  'wang-hongning': { width: 302, height: 384, x: 0, y: 0, size: 302 },
  'yan-yukun': { width: 3072, height: 4096, x: 280, y: 550, size: 2569 },
};

// The 4:5 poster frame keeps the same vertical crop and narrows it symmetrically.
export function portraitStyle(personId: string, aspectRatio = 1) {
  const crop = circularPortraitCrops[personId];
  if (!crop) return { objectFit: 'cover' } as const;
  const cropWidth = crop.size * aspectRatio;
  const cropX = crop.x + (crop.size - cropWidth) / 2;
  return {
    position: 'absolute',
    width: `${crop.width / cropWidth * 100}%`,
    height: `${crop.height / crop.size * 100}%`,
    left: `${-cropX / cropWidth * 100}%`,
    top: `${-crop.y / crop.size * 100}%`,
    objectFit: 'fill',
    backgroundColor: crop.background,
  } as const;
}
