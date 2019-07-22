# 给图片添加水印

## watermarkImage
add a watermark in your image and set watermark text style
also you can save image with watermark native

## Installation
```
  npm install  watermark-image --save
```

## usage

```
import WatermarkImg from 'watermark-image';
import exampleImg from './exampleImg';

const canvasEle = document.getElementById('canvas');
const watermarkTxtSty = {
  text:'watermark',
  fillStyle:'rgba(0,0,0,1)',
  fontSize:16,
  watermarkWidth:200,
  watermarkHeight:200
}

this.watermark = new Watermark(canvasEle);
this.watermark.draw(exampleImg, watermarkTxtSty);

```
## Demo online 
https://codesandbox.io/s/jolly-pine-0mygs

## Keywords
watermark watermarkImage typescript watermark .d.ts watermark


