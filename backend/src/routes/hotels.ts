import express, { Request, Response }  from 'express';
import Hotel from '../models/hotel';
import { BookingType, HotelSearchResponse } from '../shared/types';
import { param, validationResult } from 'express-validator';
import Stripe from "stripe";
import verifyToken from '../middleware/auth';

const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

const router=express.Router();


router.get("/search", async (req: Request, res:Response) => {
    try {
        const query = constructSearchQuery(req.query);
    
        let sortOptions = {};
        switch (req.query.sortOption) {
          case "starRating":
            sortOptions = { starRating: -1 };
            break;
          case "pricePerNightAsc":
            sortOptions = { pricePerNight: 1 };
            break;
          case "pricePerNightDesc":
            sortOptions = { pricePerNight: -1 };
            break;
        }
    
        const pageSize = 5;
        const pageNumber = parseInt(
          req.query.page ? req.query.page.toString() : "1"
        );
        const skip = (pageNumber - 1) * pageSize;
    
        const hotels = await Hotel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(pageSize);
    
        const total = await Hotel.countDocuments(query);
    
        const response: HotelSearchResponse = {
          data: hotels,
          pagination: {
            total,
            page: pageNumber,
            pages: Math.ceil(total / pageSize),
          },
        };
    
        res.json(response);
    
} catch (error) {
    console.log("error",error)
    res.status(500).json({message:"Something went wrong"});   
}
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find().sort("-lastUpdated");
    res.json(hotels);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.get("/:id",[param("id").notEmpty().withMessage("Hotel ID is required")],
async(req:Request, res:Response)=>{
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
  }
  const id=req.params.id.toString();
  try {
    const hotel = await Hotel.findById(id);
    res.json(hotel);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching hotel" });
  }
});

router.post(
  "/:hotelId/bookings/payment-intent",
  verifyToken,
  async (req: Request, res: Response) => {
    const { numberOfNights } = req.body;
    const hotelId = req.params.hotelId;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(400).json({ message: "Hotel not found" });
    }

    const totalCost = hotel.pricePerNight * numberOfNights;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost * 100,
      currency: "INR",
      metadata: {
        hotelId,
        userId: req.userId,
      },
      description: "jasdlsjdfhjdsfhsjdhflsd"
    });
    // console.log("HERer asdasd")
    if (!paymentIntent.client_secret) {
      return res.status(500).json({ message: "Error creating payment intent" });
    }

    const response = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret.toString(),
      totalCost,
    };
    // console.log("REs", response);
    res.send(response);
  }
);

router.post("/:hotelId/bookings",verifyToken,async(req:Request, res:Response)=>{
  try {

    const paymentIntentId = req.body.paymentIntentId;
    // console.log(paymentIntentId ,"payment");
    const paymentIntend= await stripe.paymentIntents.retrieve(paymentIntentId as string);
    if(!paymentIntend){
      return res.status(400).json({message: "payment intend not found"});
    }
   
    if(paymentIntend.metadata.hotelId!==req.params.hotelId || paymentIntend.metadata.userId!==req.userId){
return res.status(400).json({message:"Payment intent mismatch"});
    }
    if(paymentIntend.status!=="succeeded"){
      return res.status(400).json({message:`payment intent not succeeded.Status:${paymentIntend.status}`})

    }
    const newBooking:BookingType={
      ...req.body,
      userId:req.userId,
    }
    console.log(newBooking);
    const hotel=await Hotel.findOneAndUpdate({_id:req.params.hotelId},
      {
        $push:{bookings:newBooking},
      });
      if(!hotel){
        return res.status(404).json({message:"hotel not found"});
      }
      console.log(hotel , "dfghj");
      await hotel.save();
      res.status(200).send();

  } catch (error) {
    console.log(error);
    res.status(500).json({Message:"Something went wrong"});
    
  }
})

const constructSearchQuery = (queryParams: any) => {
    let constructedQuery: any = {};
  
    if (queryParams.destination) {
      constructedQuery.$or = [
        { city: new RegExp(queryParams.destination, "i") },
        { country: new RegExp(queryParams.destination, "i") },
      ];
    }
  
    if (queryParams.adultCount) {
      constructedQuery.adultCount = {
        $gte: parseInt(queryParams.adultCount),
      };
    }
  
    if (queryParams.childCount) {
      constructedQuery.childCount = {
        $gte: parseInt(queryParams.childCount),
      };
    }
  
    if (queryParams.facilities) {
      constructedQuery.facilities = {
        $all: Array.isArray(queryParams.facilities)
          ? queryParams.facilities
          : [queryParams.facilities],
      };
    }
  
    if (queryParams.types) {
      constructedQuery.type = {
        $in: Array.isArray(queryParams.types)
          ? queryParams.types
          : [queryParams.types],
      };
    }
  
    if (queryParams.stars) {
      const starRatings = Array.isArray(queryParams.stars)
        ? queryParams.stars.map((star: string) => parseInt(star))
        : parseInt(queryParams.stars);
  
      constructedQuery.starRating = { $in: starRatings };
    }
  
    if (queryParams.maxPrice) {
      constructedQuery.pricePerNight = {
        $lte: parseInt(queryParams.maxPrice).toString(),
      };
    }
  
    return constructedQuery;
  };
  
export default router;


