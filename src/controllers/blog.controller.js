const Blog = require('../models/blog.model');
const readingTime = require('reading-time');
const User = require('../models/user.model')

const createArticle = async (req, res, next) =>{
    
    
    const newArticle = new Blog({
        title: req.body.title,
        description: req.body.description,
        tags: req.body.tags,
        body: req.body.body,
        reading_time: readingTime(req.body.body),
        author: req.user._id
        
    })
    
    try{
        const user = req.user;
        const savedArticle = await newArticle.save();
        user.articles = user.articles.concat(savedArticle._id)
        await user.save()
        
        res.status(201).json(savedArticle) 
     } 
     catch(err){
         next(err)
     }
}

const updateState = async (req, res) => {
    const { id } = req.params;
    const { state } = req.body;
    const user = req.user._id
    try{
        const article = await Blog.findOne({id, author: req.user._id})
        console.log({'user':user})
        console.log({'author':article.author})
        
        

        if (!article) {
            console.log('you are not the author')
            return res.status(404).json({ status: false, article: null })
        }
        
        switch (state){
            case 'published':
                article.state = state;
                await article.save();
                return res.json({ status: true, article })

            case 'draft':
                return res.status(400).json("not allowed")
        }
    
        
    }
     catch(err){
        console.log(err)
        res.json(err)
}  
}

const editArticle = async (req, res, next) => {

    const { id } = req.params;
    const update = Object.keys(req.body);
    const user = req.user._id
    const allowedUpdate = ['description', 'title', 'body', 'tags']
    const isValidOperation = update.every((update) => {
        return allowedUpdate.includes(update)
    })

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!'})
    }

    try{

        const article = await Blog.findOne({id, author: req.user._id})
            console.log({'user':user})
            console.log({'author':article.author})
        
        // const article = await Blog.findById(id)
        update.forEach((update) => article[update] = req.body[update])

        if (!article) {
            return res.status(404).json({ status: false, article: null })
        }
        
        await article.save()

        return res.json({ status: true, article })
        
    } catch(err){
        next(err)
    }
}

const getArticles = async (req, res) => {
    const {query} = req;
    const {
        title,
        tags,
        state,
        page = 1, 
        per_page = 20
    } = query

    const findQuery = {};
    
    
    try{

        if(state === 'draft'){
            return res.status(400).send({ error: 'you cannot read book in draft state'})
        }
        findQuery.state = state
        if (title) {
            findQuery.title = title;
        }
        else if(tags){
            findQuery.tags = tags;
        }
        
            
        const articles = await Blog
        .find(findQuery)
        .skip(page)
        .limit(per_page)
        
        return res.json({ status: true, articles })

    
    } catch(err){
        return res.json(err);
    }
    

    
}

const ownerArticles = async (req, res) => {
    
    
    try{
        const user = await User.findOne({id:req.user._id}).populate('articles').exec()
        
        return res.status(200).send(user.articles)
    } catch(err) {
        return res.json(err);
    }
}

const getArticleById = async (req, res) => {

    const articleId = req.params.id;
    try{
        const article = await Blog.findById(articleId)

    if (article.state !== 'published') {
        return res.status(404).json({ status: false, article: null })
    }

    article.read_count += 1;
    await article.save()

    return res.json({ status: true, article })
    } catch(err){
        return res.json(err);
    }
    
}

const deleteArticleById = async (req, res) => {
    const {id} = req.params.id;
    const user = req.user._id

    try{
        
        const article = await Blog.findOneAndDelete({id, author: req.user._id})
            console.log({'user':user})
            console.log({'author':article.author})

        if (!article) {
            return res.status(404).json({ status: false, article: null })
        }

        return res.json({ status: true, article })
         
    } catch(err){
        return res.json(err);
    }
}


module.exports = {
    createArticle,
    updateState,
    editArticle,
    getArticles,
    ownerArticles,
    getArticleById,
    deleteArticleById
}