const visitorModel = require("../models/visitorModel")
const mongoose = require('mongoose')



const createVisitor = async (req, res) => {
    const { name, mobile, email, company, purpose, host, visitDate } = req.body

    try {
        if (!name || !mobile || !email || !company || !purpose || !visitDate) {
            return res.status(400).json({ error: "All fields are requird" })
        }

        const createdBy = req.user._id
        const visitor = await visitorModel.create({
            name,
            mobile,
            email,
            company,
            purpose,
            host,
            visitDate,
            createdBy
        })
        return res.status(201).json({ msg: "Visitor Created", visitor })

    } catch (error) {
        res.status(400).json({ error: error.message })
        console.log(error);

    }
}

const getVisitors = async (req, res) => {
    try {

        const visitors = await visitorModel.find()
        return res.status(200).json(visitors)


    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
}

const getVisitor = async (req, res) => {
    try {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: "No such visitor" })
        }
        const visitor = await visitorModel.findById(id);
        if (!visitor) {
            return res.status(404).json({ error: "No such visitor" });
        }
        return res.status(200).json(visitor);

    } catch (error) {

        return res.status(400).json({ error: error.message });
    }
}
const updateVisitor = async (req, res) => {
    try {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: "No such visitor" })
        }
        const visitor = await visitorModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        )
        if (!visitor) {
            return res.status(404).json({ error: "No such visitor" })
        }
        return res.status(200).json(visitor)


    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
}

const deleteVisitor = async (req, res) => {
    try {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: "No such visitor" })
        }
        const deleted = await visitorModel.findByIdAndDelete(id)
        if (!deleted) {
            return res.status(404).json({ error: "No such visitor" })
        }
        return res.status(200).json({
            message: "Visitor deleted successfully",
            deleted
        })
    }catch(error){
        return res.status(400).json({error:error.message})
    }
  
}


module.exports = {
    createVisitor,
    getVisitors,
    getVisitor,
    updateVisitor,
    deleteVisitor
}