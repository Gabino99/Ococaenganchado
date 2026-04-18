import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

export function compressImage(file, maxDim = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas compression failed')); return; }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          );
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function uploadItemPhotos(userId, files, onProgress) {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (file.type.startsWith('image/')) {
      try {
        file = await compressImage(file);
      } catch (err) {
        console.warn('Compression failed for', file.name, err);
      }
    }
    if (onProgress) onProgress(i + 1, files.length);
    const path = `items/${userId}/${Date.now()}_${i}.jpg`;
    const storageRef = ref(storage, path);
    const uploadPromise = uploadBytes(storageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Upload timed out for photo ${i + 1}`)), 60000)
    );
    const url = await Promise.race([uploadPromise, timeout]);
    urls.push(url);
  }
  return urls;
}
