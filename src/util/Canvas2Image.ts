interface IJudgeCanvas {
    canvas: boolean
    imageData: boolean
    dataURL: boolean
    btoa: boolean
}

//reset download img params
interface IGenImgParams {
    width?: number
    height?: number
    imageType?: string
    imageName?: string
}

class Canvas2Image {
    private canvas: HTMLCanvasElement
    private downloadMime: Readonly<string> = 'image/octet-stream'

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
    }

    private $support = ((): IJudgeCanvas => {
        const canvas: HTMLCanvasElement = document.createElement('canvas')
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!
        return {
            canvas: !!ctx,
            imageData: !!ctx.getImageData,
            dataURL: !!canvas.toDataURL,
            btoa: !!window.btoa,
        }
    })()

    // add prefix 'image/'
    private fixType = (imageType: string): string => {
        imageType = imageType.toLowerCase().replace(/jpg/i, 'jpeg')
        const res: RegExpMatchArray | null = imageType.match(/png|jpeg|bmp|gif/)
        const r: string = res ? res[0] : 'jpeg'
        return 'image/' + r
    }

    //get canvas with width and height
    private scaleCanvas = (
        canvasElement: HTMLCanvasElement,
        width: number | undefined,
        height: number | undefined,
    ): HTMLCanvasElement => {
        const w: number = canvasElement.width
        const h: number = canvasElement.height
        if (width === undefined) {
            width = w
        }
        if (height === undefined) {
            height = h
        }

        const retCanvas: HTMLCanvasElement = document.createElement('canvas')
        const retCtx: CanvasRenderingContext2D = retCanvas.getContext('2d')!
        retCanvas.width = width
        retCanvas.height = height
        retCtx.drawImage(canvasElement, 0, 0, w, h, 0, 0, width, height)
        return retCanvas
    }

    //get image base64 data
    private getImageData = (canvasElement: HTMLCanvasElement): ImageData => {
        const w: number = canvasElement.width
        const h: number = canvasElement.height
        return canvasElement.getContext('2d')!.getImageData(0, 0, w, h)
    }

    //create bitmap image
    private genBitmapImage = (oData: ImageData) => {
        //
        // BITMAPFILEHEADER: http://msdn.microsoft.com/en-us/library/windows/desktop/dd183374(v=vs.85).aspx
        // BITMAPINFOHEADER: http://msdn.microsoft.com/en-us/library/dd183376.aspx
        //

        const biWidth: number = oData.width
        const biHeight: number = oData.height
        const biSizeImage: number = biWidth * biHeight * 3
        const bfSize: number = biSizeImage + 54 // total header size = 54 bytes

        //
        //  typedef struct tagBITMAPFILEHEADER {
        //  	WORD bfType;
        //  	DWORD bfSize;
        //  	WORD bfReserved1;
        //  	WORD bfReserved2;
        //  	DWORD bfOffBits;
        //  } BITMAPFILEHEADER;
        //
        const BITMAPFILEHEADER = [
            // WORD bfType -- The file type signature; must be "BM"
            0x42,
            0x4d,
            // DWORD bfSize -- The size, in bytes, of the bitmap file
            bfSize & 0xff,
            (bfSize >> 8) & 0xff,
            (bfSize >> 16) & 0xff,
            (bfSize >> 24) & 0xff,
            // WORD bfReserved1 -- Reserved; must be zero
            0,
            0,
            // WORD bfReserved2 -- Reserved; must be zero
            0,
            0,
            // DWORD bfOffBits -- The offset, in bytes, from the beginning of the BITMAPFILEHEADER structure to the bitmap bits.
            54,
            0,
            0,
            0,
        ]

        //
        //  typedef struct tagBITMAPINFOHEADER {
        //  	DWORD biSize;
        //  	LONG  biWidth;
        //  	LONG  biHeight;
        //  	WORD  biPlanes;
        //  	WORD  biBitCount;
        //  	DWORD biCompression;
        //  	DWORD biSizeImage;
        //  	LONG  biXPelsPerMeter;
        //  	LONG  biYPelsPerMeter;
        //  	DWORD biClrUsed;
        //  	DWORD biClrImportant;
        //  } BITMAPINFOHEADER, *PBITMAPINFOHEADER;
        //
        const BITMAPINFOHEADER = [
            // DWORD biSize -- The number of bytes required by the structure
            40,
            0,
            0,
            0,
            // LONG biWidth -- The width of the bitmap, in pixels
            biWidth & 0xff,
            (biWidth >> 8) & 0xff,
            (biWidth >> 16) & 0xff,
            (biWidth >> 24) & 0xff,
            // LONG biHeight -- The height of the bitmap, in pixels
            biHeight & 0xff,
            (biHeight >> 8) & 0xff,
            (biHeight >> 16) & 0xff,
            (biHeight >> 24) & 0xff,
            // WORD biPlanes -- The number of planes for the target device. This value must be set to 1
            1,
            0,
            // WORD biBitCount -- The number of bits-per-pixel, 24 bits-per-pixel -- the bitmap
            // has a maximum of 2^24 colors (16777216, Truecolor)
            24,
            0,
            // DWORD biCompression -- The type of compression, BI_RGB (code 0) -- uncompressed
            0,
            0,
            0,
            0,
            // DWORD biSizeImage -- The size, in bytes, of the image. This may be set to zero for BI_RGB bitmaps
            biSizeImage & 0xff,
            (biSizeImage >> 8) & 0xff,
            (biSizeImage >> 16) & 0xff,
            (biSizeImage >> 24) & 0xff,
            // LONG biXPelsPerMeter, unused
            0,
            0,
            0,
            0,
            // LONG biYPelsPerMeter, unused
            0,
            0,
            0,
            0,
            // DWORD biClrUsed, the number of color indexes of palette, unused
            0,
            0,
            0,
            0,
            // DWORD biClrImportant, unused
            0,
            0,
            0,
            0,
        ]

        const iPadding = (4 - ((biWidth * 3) % 4)) % 4

        const aImgData = oData.data

        let strPixelData = ''
        let biWidth4 = biWidth << 2
        let y = biHeight
        let fromCharCode = String.fromCharCode

        do {
            let iOffsetY = biWidth4 * (y - 1)
            let strPixelRow = ''
            for (let x = 0; x < biWidth; x++) {
                let iOffsetX = x << 2
                strPixelRow +=
                    fromCharCode(aImgData[iOffsetY + iOffsetX + 2]) +
                    fromCharCode(aImgData[iOffsetY + iOffsetX + 1]) +
                    fromCharCode(aImgData[iOffsetY + iOffsetX])
            }

            for (let c = 0; c < iPadding; c++) {
                strPixelRow += String.fromCharCode(0)
            }

            strPixelData += strPixelRow
        } while (--y)

        const strEncoded = this.encodeData(BITMAPFILEHEADER.concat(BITMAPINFOHEADER)) + this.encodeData(strPixelData)

        return strEncoded
    }

    //encode image data
    private encodeData = (data: any): string => {
        if (!window.btoa) {
            throw 'btoa undefined'
        }
        let str: string = ''
        if (typeof data === 'string') {
            str = data
        } else {
            for (let i = 0; i < data.length; i++) {
                str += String.fromCharCode(data[i])
            }
        }
        return btoa(str)
    }

    // change base64 img data to URI data
    private makeURI = (imgBase64StrData: string, imgType: string): string => {
        return 'data:' + imgType + ';base64,' + imgBase64StrData
    }

    // get image URL by canvas
    private getDataURL = (
        canvasElement: HTMLCanvasElement,
        imageType: string,
        width: number | undefined,
        height: number | undefined,
    ) => {
        const { scaleCanvas } = this
        canvasElement = scaleCanvas(canvasElement, width, height)
        return canvasElement.toDataURL(imageType)
    }

    //save image local
    private saveFile = (imgBase64StrData: string, imgName?: string, imgType?: string): void => {
        const aLink: HTMLAnchorElement = document.createElement('a')
        const imageName = `${imgName}` || 'watermark'
        const imageType = `${imgType}` || 'jpg'
        aLink.download = `${imageName}.${imageType}`
        aLink.href = imgBase64StrData
        aLink.click()
    }

    // generate img tag
    private genImage = (imgBase64StrData: string) => {
        const img: HTMLImageElement = document.createElement('img')
        img.src = imgBase64StrData;
        return img
    }

    // canvas to img tag
    convertToImage = (canvas: HTMLCanvasElement, width: number, height: number, type: string) => {
        const { $support, fixType, getImageData, scaleCanvas, genBitmapImage, genImage, makeURI, getDataURL } = this
        if ($support.canvas && $support.dataURL) {
            if (type === undefined) {
                type = 'png'
            }

            type = fixType(type)

            if (/bmp/.test(type)) {
                const data = getImageData(scaleCanvas(canvas, width, height))
                const strData = genBitmapImage(data)
                return genImage(makeURI(strData, 'image/bmp'))
            } else {
                const strData = getDataURL(canvas, type, width, height)
                return genImage(strData)
            }
        }
    }

    // save image local
    saveAsImage = (imgParams: IGenImgParams) => {
        const {
            canvas,
            makeURI,
            scaleCanvas,
            getImageData,
            downloadMime,
            genBitmapImage,
            fixType,
            saveFile,
            getDataURL,
        } = this
        const { width, height, imageName } = imgParams
        let { imageType } = imgParams
        if (this.$support.canvas && this.$support.dataURL) {
            if (imageType === undefined) {
                imageType = 'png'
            }
            const strImgType = fixType(imageType)
            if (/bmp/.test(strImgType)) {
                const imgData = getImageData(scaleCanvas(canvas, width, height))
                const strData = genBitmapImage(imgData)
                saveFile(makeURI(strData, downloadMime))
            } else {
                const strData = getDataURL(canvas, strImgType, width, height)
                saveFile(strData, imageName, imageType)
            }
        }
    }
}

export default Canvas2Image
