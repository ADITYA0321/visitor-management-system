const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const validator = require('validator')
const jwt = require('jsonwebtoken')

const createToken = (id) => {
    return jwt.sign({id}, process.env.SECRET, {expiresIn:'3d'})
}




const signupUser = async (req, res)=>{
    const {name, email, password, role} = req.body
    

    try{
       
        if(!name || !email || !password){
            return res.status(400).json({error:"All fields are requird"})
        }
         if(!validator.isEmail(email) ){
            
            return res.status(400).json({error:"invalid email"})
        }
        const existingUser = await User.findOne({email})
        if(existingUser){
            return res.status(400).json({ error: "Email already exists" })
        }
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)
       
        const user = await User.create({name, email, password:hash, role})
        res.status(201).json(user)
    }catch(error){
        res.status(400).json ({error:error.message})
        console.log(error);
    return res.status(500).json({
        error: error.message
    });
        
    }        
    
}

    const loginUser = async (req, res)=>{
        const {email, password} = req.body
        try{
            if(!email || !password){
                return res.status(400).json({error:"All fields are required"})
            }
            const user = await User.findOne({email})
            if(!user){
                return res.status(400).json({error: "Incorrect Email"})
            }
            const match = await bcrypt.compare(password, user.password) 
            if(!match){
                return res.status(400).json({error:"Incorrect Password"})
            }
                const token = createToken (user._id)
        
                return res.status(200).json(
                 {
                    token: token,
                    msg:"Login Sucsses",
                     name: user.name,
                    email: user.email,
                    role: user.role

                })
            
        }catch(error){
                console.log(error);
    return res.status(500).json({
        error: error.message
    });
                
        }
    }


 module.exports = {
    signupUser,
    loginUser
 }