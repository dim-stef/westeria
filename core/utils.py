from io import BytesIO
from PIL import Image
import math
import sys

def JPEGSaveWithTargetSize(image, filename, target):
    """Save the image as JPEG with the given name at best quality that makes less than "target" bytes"""
    # Min and Max quality
    Qmin, Qmax = 1, 96
    # Highest acceptable quality found
    Qacc = -1

    image = Image.open(image)
    im = image.copy()

    # try to guess for big numbers
    while Qmax>Qmin:
        m = math.floor((Qmin + Qmax) / 2)

        # Encode into memory and get size
        buffer = BytesIO()
        im.thumbnail([72,72],Image.BICUBIC)
        im.save(buffer, format="JPEG", quality=m)
        s = buffer.getbuffer().nbytes
        if s <= target:
            Qacc = m
            Qmin = m + 1
        elif s > target:
            Qmax = m - 1

    # Write to disk at the defined quality
    if Qacc > -1:
        im.save(s, format="PNG", quality=Qacc)
    else:
        return None
    return im, buffer