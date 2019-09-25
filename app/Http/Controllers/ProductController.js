const { validationResult } = require("express-validator")
const { raw } = require("objection")
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const Product = require("../../Models/Product")
const ImageUpload = require("../../Helpers/ImageUpload")

module.exports = {
    /*
    Get data product based on query string
    @method GET
    @param req.query : pageIndex, limit, search, sort, mode
    @return Json
    */
    getProduct: async (req, res) => {
        // first page
        let pageIndex = req.query.page ? req.query.page-1 : 0
        let limit = req.query.limit ? req.query.limit : 12
        let search = req.query.search ? req.query.search : ""
        let sort = req.query.sort ? req.query.sort : "created_at"
        let sortMode = req.query.mode ? req.query.mode : "asc"

        const products = await Product.query()
        .select(raw("products.*, categories.name as category"))
        .join("categories", "products.category_id", "=", "categories.id")
        .where("products.name", "LIKE", "%" + search + "%")
        .orderBy(sort == "category" ? "categories.name" : `products.${sort}`, sortMode)
        .page(pageIndex, limit)

        return res.json({
            message: "OKE",
            status: 200,
            data: products,
            error: false
        })
    },

    /*
    Create product with image
    @header form-data
    @method POST
    @param req.body : name, description, image, category_id, price, qty
    @return Json
    */
    createProduct: async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.json({
                message: "Validation error",
                status: 304,
                data: {},
                errors: errors.array()
            })
        }

        //check if has image file
        if (!req.files) {
            return res.json({
                message: "No image choosen",
                status: 304,
                data: {},
                errors: true
            })
        }

        if (!req.files.image) {
            return res.json({
                message: "Can't find key image",
                status: 304,
                data: {},
                errors: true
            })
        }

        const imageName = await ImageUpload.upload(req.files.image)

        const insertProduct = await Product.query()
        .insert({
            name        : req.body.name,
            description : req.body.description,
            image       : imageName,
            category_id : req.body.category_id,
            price       : req.body.price,
            qty         : 0
        })

        //check if product has successfully added to db
        if (insertProduct instanceof Product == false) {
            return res.json({
                message: "Can't add product to db",
                status: 500,
                data: {},
                errors: true
            })
        }

        return res.json({
            message: "OKE",
            status: 200,
            data: insertProduct,
            errors: false
        })
    },

    /*
    Update product with image
    @header form-data
    @method PUT
    @param req.body : name, description, image (if exists), category_id, price, qty
    @return Json
    */
    updateProduct: async (req, res) => {
        // check user request
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.json({
                message: "Validation errors",
                status: 304,
                data: {},
                errors: errors.array()
            })
        }

        if (req.body.qty < 0) {
            return res.json({
                message: "quantity can't be zero",
                status: 304,
                data: {},
                errors: errors.array()
            })
        }

        let product

        if (req.files) {
            if (req.files.image) {

                const imageName = await ImageUpload.upload(req.files.image)

                product = await Product.query()
                .findById(req.params.id)
                .patch({
                    name        : req.body.name,
                    description : req.body.description,
                    image       : imageName,
                    category_id : req.body.category_id,
                    price       : req.body.price,
                    qty         : (req.body.qty < 0 ? 0 : req.body.qty)
                })

            }
        }else{
            product = await Product.query()
            .findById(req.params.id)
            .patch({
                name        : req.body.name,
                description : req.body.description,
                category_id : req.body.category_id,
                price       : req.body.price,
                qty         : (req.body.qty < 0 ? 0 : req.body.qty)
            })
        }

        if (!product) {
            return res.json({
                message : "Can't update product to db",
                status  : 500,
                data    : {},
                errors  : true
            })
        }

        return res.json({
            message : "OKE",
            status  : 200,
            data    : {},
            errors  : false
        })
    },

    /*
    Delete product with related image
    @method DELETE
    @param req.params : id
    @return Json
    */
    deleteProduct: async (req, res) => {

        // get data product image
        const productImage = await Product.query()
        .select("image")
        .findById(req.params.id)

        // delete related image
        await fs.unlinkSync(`public/upload/${productImage.image}`)

        const product = await Product.query()
        .deleteById(req.params.id)

        if (!product) {
            return res.json({
                message: "Can't delete product from db",
                status: 500,
                data: {},
                errors: true
            })
        }

        return res.json({
            message: "OKE",
            status: 200,
            data: {},
            errors: false
        })
    },
    searchProduct: async (req, res) => {

        // first page
        let pageIndex = req.query.page ? req.query.page-1 : 0

        const products = await Product.query()
        .where("name", "LIKE", "%" + req.body.keyword + "%")
        .orderBy("name")
        .page(pageIndex, 2)

        if (!products) {
            return false
        }

        return products
    },
    sortProductByName: async (req, res) => {
        let pageIndex = req.query.page ? req.query.page-1 : 0
        const products = await Product.query()
        .orderBy("name")
        .page(pageIndex, 2)

        return products
    },
    sortProductByUpdate: async (req, res) => {
        let pageIndex = req.query.page ? req.query.page-1 : 0
        const products = await Product.query()
        .orderBy("updated_at")
        .page(pageIndex, 2)

        return products
    }
};
