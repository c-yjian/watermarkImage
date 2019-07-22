import Canvas2Image from './util/Canvas2Image'

interface IUserOpts {
    text: string
    fontSize: number
    fillStyle: string
    watermarkWidth: number
    watermarkHeight: number
}

class Watermark {
    private img: HTMLImageElement = new Image()
    private step: number = 0
    // 水印的 canvas
    private waterCanvas: HTMLCanvasElement = document.createElement('canvas')
    private waterTextRotate: number = 20
    private img_width: number = 0
    private img_height: number = 0
    private userOptions: any = {}
    private watermarkCanvas: HTMLCanvasElement = document.createElement('canvas')
    // 整个画板
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D

    constructor(canvas: HTMLCanvasElement, opt?: any) {
        let { watermarkCanvas } = this
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        ;(watermarkCanvas as any).width = '160px'
        ;(watermarkCanvas as any).height = '100px'
    }
    setOptions = (userOpts: Partial<IUserOpts>): void => {
        const { img, createWatermarkCanvas, _draw } = this
        this.userOptions = userOpts
        createWatermarkCanvas()
        if (!img) {
            return
        }
        _draw()
    }

    draw = (dataURL: string, userOpts?: IUserOpts): void => {
        let { _draw, setOptions } = this
        userOpts && setOptions(userOpts)
        this.step = 0
        this.img.src = dataURL
        this.img.onload = () => {
            this.img_width = this.img.width
            const max = 2000
            if (this.img_width > max) {
                this.img_width = max
                this.img_height = (max * this.img.height) / this.img.width
            } else {
                this.img_height = this.img.height
            }
            _draw()
        }
    }

    rotate = (): void => {
        const { img, _draw } = this
        if (!img) {
            return
        }
        this.step >= 3 ? (this.step = 0) : this.step++
        _draw()
    }

    save = (): void => {
        const { img, canvas } = this
        if (!img) {
            return
        }
        new Canvas2Image(canvas).saveAsImage({
            imageName: 'waterMark',
            imageType: 'png',
        })
    }

    private _draw = () => {
        this.drawImage()
        this.addWatermark()
    }

    private getOptions = (): IUserOpts => {
        const { userOptions } = this
        const defaultOptions: IUserOpts = {
            text: 'default water mark',
            fontSize: 23,
            fillStyle: 'rgba(100, 100, 100, 0.4)',
            watermarkWidth: 280,
            watermarkHeight: 180,
        }

        const options: IUserOpts = { ...defaultOptions, ...userOptions }

        if (options.fontSize < 10) {
            options.fontSize = 10
        }
        if (options.watermarkWidth < 100) {
            options.watermarkWidth = 100
        }
        if (options.watermarkHeight < 100) {
            options.watermarkHeight = 100
        }

        return options
    }

    private createWatermarkCanvas = (): void => {
        const { waterCanvas, getOptions, waterTextRotate } = this
        const { text, fontSize, fillStyle, watermarkWidth, watermarkHeight } = getOptions()
        const wctx: CanvasRenderingContext2D = waterCanvas.getContext('2d')!
        waterCanvas.width = watermarkWidth
        waterCanvas.height = watermarkHeight
        // 水印样式设置
        wctx.font = `${fontSize}px 黑体`
        // 文字倾斜角度
        wctx.rotate((-waterTextRotate * Math.PI) / 180)
        wctx.fillStyle = fillStyle
        const { sin } = Math
        // 文字水印 canvas旋转之后，需要重新根据旋转的角度计算高度 y
        const deltH = sin((waterTextRotate * Math.PI) / 180) * watermarkWidth
        wctx.fillText(text, 0, fontSize + deltH)
    }

    private drawImage = (): void => {
        const { ctx, canvas, step, img_width, img_height, img } = this
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        switch (step) {
            default:
            case 0:
                canvas.width = img_width
                canvas.height = img_height
                ctx.drawImage(img, 0, 0, img_width, img_height)
                break
            case 1:
                canvas.width = img_height
                canvas.height = img_width
                ctx.save()
                ctx.rotate((90 * Math.PI) / 180)
                ctx.drawImage(img, 0, -img_height, img_width, img_height)
                ctx.restore()
                break
            case 2:
                canvas.width = img_width
                canvas.height = img_height
                ctx.save()
                ctx.rotate((180 * Math.PI) / 180)
                ctx.drawImage(img, -img_width, -img_height, img_width, img_height)
                ctx.restore()
                break
            case 3:
                canvas.width = img_height
                canvas.height = img_width
                ctx.save()
                ctx.rotate((270 * Math.PI) / 180)
                ctx.drawImage(img, -img_width, 0, img_width, img_height)
                ctx.restore()
                break
        }
    }

    private addWatermark = (): void => {
        const { ctx, waterCanvas, canvas } = this
        // 平铺--重复小块的canvas
        const pat = ctx.createPattern(waterCanvas, 'repeat')
        ctx.fillStyle = pat!
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
}

export default Watermark
