const express = require('express');
const Router = express();
const Product = require('../models/Product');
const upload = require('../middleware/imgUpload');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: "dotmufoiy",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

Router.post('/product/create', upload, async (req, res) => {
    try {
        if(req.file){
            cloudinary.v2.uploader.upload(req.file.path, (err, result) => {  
                if (err) res.json(err.message);  
        
                Product.create({ 
                    ...req.body, 
                    imageUrl: result.secure_url,
                    imageUrlId: result.public_id,
                    createdAt: new Date().toISOString(),
                }).then(createdProduct => {
                    res.json(createdProduct);
                })
            });
        } else {
            Product.create({ 
                ...req.body, 
                createdAt: new Date().toISOString(),
            }).then(createdProduct => res.json(createdProduct))
        }
    } catch(error){
        res.status(400).send({ error: 'Error while uploading file try again later' });
    }
});

Router.post('/product/create-comment', async (req, res) => {
    try {
        const product = await Product.findById(req.body.productId);

        const now = moment(); 
        const formattedDate = now.format('YYYY-MM-DD HH:mm:ss');

        product.comments.push({
            author: req.body.author,
            authorImage: req.body.authorImage,
            productId: req.body.productId,
            id: uuidv4(),
            description: req.body.description,
            date: formattedDate,
        })
        
        await product.save();

        res.status(202).send({ message: 'Comment added successfully' })
    } catch(error){;
        res.status(400).send({ error: 'Error while uploading file try again later' });
    }
});

Router.get('/products', async (req, res) => {
    try {
        const products = await Product.find();

        res.json(products);
    } catch(error){
        res.status(400).send({ error: 'Error while uploading file try again later' });
    }
})

Router.get('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        res.json(product);
    } catch(error){
        res.status(400).send({ error: 'Error while uploading file try again later' });
    }
})

Router.delete('/product/delete/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        Product.deleteOne({ _id: req.params.id }).then(() => {
            product.imageUrlId && cloudinary.v2.uploader.destroy(product.imageUrlId)
        })

        res.status(200).send({ message: 'Item successfully deleted' });
    } catch(error){
        res.status(400).send({ error: 'Error while uploading file try again later' });
    }
})

Router.put('/product/edit/:id', upload, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if(req.file){
            product.imageUrlId && cloudinary.v2.uploader.destroy(product.imageUrlId);

            cloudinary.v2.uploader.upload(req.file.path, (err, result) => {  
                if (err) res.json(err.message);  
        
                Product.updateOne({_id: req.params.id}, {
                    ...req.body,
                    imageUrl: result.secure_url,
                    imageUrlId: result.public_id,
                }).then(() => {
                    Product.findById(req.params.id).then((result) => res.json(result))
                }).catch(err => {
                    res.status(500).json(err)
                })
            });
        } else {
            product.imageUrlId && cloudinary.v2.uploader.destroy(product.imageUrlId);

            await Product.updateOne({_id: req.params.id}, { $unset: { 
                imageUrl: '',
                imageUrlId: ''
            }})

            await Product.updateOne({_id: req.params.id}, req.body).then(() => {
                Product.findById(req.params.id).then((result) => res.json(result))
            })
        }
    } catch(error){
        res.status(400).send({ error: 'Error while uploading file try again later' });
    }
})

module.exports = Router;
