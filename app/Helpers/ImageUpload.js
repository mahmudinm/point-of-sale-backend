const uuidv4 = require('uuid/v4')

module.exports = {
    upload: async (image) => {
        let imageFile = image
        let imageMime = imageFile.mimetype.split("/")[1] // get format image
        let isImage = ["png", "jpg", "jpeg", "svg", "gif"].includes(imageMime)

        // check is image or not
        if (!isImage) {
            return {
                message: `please upload an image file not ${imageMime} file`,
                error: true
            }
        }

        // generate random name for image file
        const imageName = `${uuidv4()}.${imageMime}`
        // move image file to upload folder
        const moveImage = imageFile.mv(`public/images/${imageName}`)

        // check if error when moving image
        if (!moveImage) {
            return {
                message: "can't upload image",
                error: true
            }
        }

        return imageName
    }
};