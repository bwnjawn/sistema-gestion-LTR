export function compressAndReadFile(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
 return new Promise((resolve, reject) => {
   const reader = new FileReader()
   reader.onload = (event) => {
     const img = new Image()
     img.onload = () => {
       const canvas = document.createElement('canvas')
       let width = img.width
       let height = img.height
       if (width > maxWidth) {
         height = Math.round((height * maxWidth) / width)
         width = maxWidth
       }
       canvas.width = width
       canvas.height = height
       const ctx = canvas.getContext('2d')
       if (ctx) {
         ctx.drawImage(img, 0, 0, width, height)
         resolve(canvas.toDataURL('image/jpeg', quality))
       } else {
         resolve(event.target?.result as string)
       }
     }
     img.onerror = () => resolve(event.target?.result as string)
     img.src = event.target?.result as string
   }
   reader.onerror = (err) => reject(err)
   reader.readAsDataURL(file)
 })
}