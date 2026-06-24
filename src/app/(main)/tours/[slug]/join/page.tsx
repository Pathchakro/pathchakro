'use client';

import React, { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { User, CheckCircle2, ArrowRight, Smartphone, Copy, Globe, Wallet, Mail, MapPin, Loader2, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/components/auth/LoginModal';

const BD_PHONE_REGEX = /^(?:\+8801|01)[3-9]\d{8}$/;

const formSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().trim().regex(BD_PHONE_REGEX, 'Invalid Bangladesh phone number').max(15, 'Phone number is too long'),
  email: z.string().trim().email('Invalid email address'),
  address: z.string().trim().optional(),
  seats: z.number().min(1, 'At least 1 seat is required').max(10, 'Maximum 10 seats allowed'),
  paymentAmount: z.string().min(1, 'Amount is required'),
});

type JoinFormData = z.infer<typeof formSchema>;

const manualPaymentConfig: any = {
  bkash: { active: true, number: '01919011101', qrCode: '/PaymentQr.jpg', color: 'bg-[#d12053]/10 border-[#d12053]/30 text-[#d12053]', label: 'bKash' },
  nagad: { active: true, number: '01919011101', qrCode: '/PaymentQr.jpg', color: 'bg-[#f47321]/10 border-[#f47321]/30 text-[#f47321]', label: 'Nagad' },
  rocket: { active: true, number: '01919011101', qrCode: '/PaymentQr.jpg', color: 'bg-[#8c2d82]/10 border-[#8c2d82]/30 text-[#8c2d82]', label: 'Rocket' },
  banglaQr: { active: true, qrCode: '/PaymentQr.jpg', color: 'bg-indigo-50 border-indigo-200 text-indigo-600', label: 'Bangla QR' }
};

export default function TourJoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [tour, setTour] = useState<any>(null);
  const [tourLoading, setTourLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [manualDetails, setManualDetails] = useState({
    senderNumber: '',
    transactionId: ''
  });
  const [paymentDetailTab, setPaymentDetailTab] = useState<'phone' | 'trx'>('phone');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JoinFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      seats: 1,
      paymentAmount: '0',
    },
  });

  const seatsCount = watch('seats');

  useEffect(() => {
    if (session?.user) {
      setValue('name', session.user.name || '');
      setValue('email', session.user.email || '');
    }
  }, [session, setValue]);

  useEffect(() => {
    async function fetchTour() {
      try {
        setTourLoading(true);
        const res = await fetch(`/api/tours/slug/${slug}`);
        if (!res.ok) throw new Error('Tour not found');
        const data = await res.json();
        // The API returns either { tour } or tour directly
        const tourData = data.tour || data;
        setTour(tourData);
        setValue('paymentAmount', (tourData.budget || 0).toString());
      } catch (err) {
        toast.error('Failed to load tour details');
      } finally {
        setTourLoading(false);
      }
    }
    fetchTour();
  }, [slug, setValue]);

  // Recalculate payment amount based on number of seats
  useEffect(() => {
    if (tour) {
      const total = (tour.budget || 0) * (seatsCount || 1);
      setValue('paymentAmount', total.toString());
    }
  }, [seatsCount, tour, setValue]);

  if (status === 'unauthenticated') {
    return (
      <div className="container max-w-md py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Please Login to Continue</h2>
        <p className="text-muted-foreground">You need to be logged in to join tours.</p>
        <Button onClick={() => setShowLoginModal(true)}>Log In</Button>
        <LoginModal 
          open={showLoginModal} 
          onOpenChange={setShowLoginModal}
          title="Login to Join Tour"
          description="Sign in to join this exciting tour with Pathchakro."
        />
      </div>
    );
  }

  if (tourLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="container py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Tour Not Found</h2>
        <Button asChild><Link href="/tours">Go back to Tours</Link></Button>
      </div>
    );
  }

  const budget = tour.budget || 0;
  const totalPrice = budget * seatsCount;

  async function onSubmit(values: JoinFormData) {
    let methodValue = '';
    let verificationMobile = '';
    let verificationTrx = '';

    if (budget > 0) {
      if (!selectedMethod) {
        toast.error('দয়া করে পেমেন্ট মেথড সিলেক্ট করুন');
        return;
      }

      if (paymentDetailTab === 'phone') {
        verificationMobile = manualDetails.senderNumber;
        if (!verificationMobile.trim()) {
          toast.error('আপনার পেমেন্ট নম্বরটি দিন');
          return;
        }
      } else {
        verificationTrx = manualDetails.transactionId;
        if (!verificationTrx.trim()) {
          toast.error('ট্রানজেকশন আইডি (TrxID) দিন');
          return;
        }
      }

      methodValue = selectedMethod.id;
    } else {
      methodValue = 'free';
    }

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`/api/tours/${tour.slug || tour._id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: methodValue,
          transactionId: verificationTrx || undefined,
          mobileNumber: verificationMobile || undefined,
          name: values.name,
          phone: values.phone,
          email: values.email,
          address: values.address || undefined,
          seats: values.seats,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: 'আবেদন জমা হয়েছে!',
          text: budget > 0 
            ? `আপনার ${tour.title} ট্যুরে বুকিং আবেদনটি সফলভাবে গৃহীত হয়েছে। আমরা দ্রুত পেমেন্ট ভেরিফাই করে আপনার সাথে যোগাযোগ করবো।`
            : `আপনার ${tour.title} ট্যুর বুকিং সফলভাবে সম্পন্ন হয়েছে।`,
          icon: 'success',
          confirmButtonColor: 'var(--primary)',
          customClass: {
            popup: 'rounded-3xl',
            confirmButton: 'rounded-xl font-bold px-6 py-3',
          }
        });
        router.push(`/tours/${tour.slug}`);
      } else {
        throw new Error(data.error || 'Failed to submit booking');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        toast.error(error.message || 'Error submitting booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container max-w-2xl py-10 space-y-8">
      <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" asChild>
        <Link href={`/tours/${slug}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tour
        </Link>
      </Button>

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-black tracking-tighter uppercase">Book Tour Seats</h1>
        <p className="text-muted-foreground text-sm">Register and complete your payment to join "{tour.title}"</p>
      </div>

      <div className="max-w-2xl mx-auto bg-card p-6 md:p-10 rounded-[2rem] border shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" /> শিক্ষার্থীর নাম
            </Label>
            <Input placeholder="শিক্ষার্থীর পূর্ণ নাম" {...register('name')} className="h-12 rounded-xl bg-muted/30 border-muted" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5" /> শিক্ষার্থীর মোবাইল নম্বর
            </Label>
            <Input placeholder="017XXXXXXXX" {...register('phone')} className="h-12 rounded-xl bg-muted/30 border-muted" />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> শিক্ষার্থীর ইমেইল
            </Label>
            <Input type="email" placeholder="example@email.com" {...register('email')} className="h-12 rounded-xl bg-muted/30 border-muted" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> শিক্ষার্থীর পূর্ণ ঠিকানা (ঐচ্ছিক)
            </Label>
            <Input placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা" {...register('address')} className="h-12 rounded-xl bg-muted/30 border-muted" />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> মোট সিট সংখ্যা
              </Label>
              <Input 
                type="number" 
                placeholder="1" 
                {...register('seats', { valueAsNumber: true })} 
                className="h-12 rounded-xl bg-muted/30 border-muted font-bold text-center" 
              />
              {errors.seats && <p className="text-xs text-red-500">{errors.seats.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" /> মোট পেমেন্ট (৳)
              </Label>
              <Input type="number" readOnly {...register('paymentAmount')} className="h-12 rounded-xl bg-muted border-muted font-black text-primary cursor-not-allowed" />
              {errors.paymentAmount && <p className="text-xs text-red-500">{errors.paymentAmount.message}</p>}
            </div>
          </div>

          {/* Payment Method Selector - Only display if budget > 0 */}
          {budget > 0 && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" /> পেমেন্ট মেথড সিলেক্ট করুন
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['bkash', 'nagad', 'rocket', 'banglaQr'].map((method) => {
                  const config = manualPaymentConfig[method];
                  if (!config?.active) return null;
                  const isSelected = selectedMethod?.id === method;
                  return (
                    <div 
                      key={method} 
                      onClick={() => {
                        setSelectedMethod({ id: method, ...config });
                        setPaymentDetailTab('phone');
                        setShowPaymentModal(true);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-muted/50 ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-muted'
                      }`}
                    >
                      <div className={`px-3 py-1 rounded-md text-xs font-black uppercase ${config.color}`}>
                        {config.label}
                      </div>
                      {isSelected && (
                        <div className="text-[9px] font-bold text-primary flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Added
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!selectedMethod && (
                <p className="text-[10px] text-destructive font-black uppercase tracking-wider animate-pulse">
                  * পেমেন্ট সম্পন্ন করতে যেকোনো একটি অপশন সিলেক্ট করুন
                </p>
              )}
            </div>
          )}

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 rounded-xl text-white transition-all font-black uppercase tracking-[0.2em] text-sm"
            >
              {isSubmitting ? 'প্রসেস হচ্ছে...' : 'ভর্তি নিশ্চিত করুন'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Manual Payment Verification Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border flex flex-col max-h-[90vh]">
          <DialogHeader className="py-4 px-6 bg-primary text-white relative shrink-0">
            <div className="flex items-center gap-3">
              <div className="text-left">
                <DialogTitle className="text-base md:text-lg font-black uppercase tracking-tight">
                  {selectedMethod?.id === 'banglaQr' ? 'Pay via Bangla QR' : `Pay via ${selectedMethod?.label}`}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-h-[60vh] pr-2">
            {/* Payment Info */}
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-3">
              {selectedMethod?.id !== 'banglaQr' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Send Money To</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[9px] py-0.5 px-1.5">Personal Number</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <p className="text-base font-black tracking-widest bg-background px-3 py-1.5 rounded-lg border border-primary/10 flex-1 text-center select-all">
                      {selectedMethod?.number}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 rounded-lg text-[10px] font-bold border hover:bg-primary hover:text-white transition-all shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMethod?.number);
                        toast.success('Number copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </>
              )}
              
              <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-primary/10">
                <p className="text-[9px] font-bold uppercase opacity-45">Scan QR Code to Pay</p>
                <div className="p-1.5 bg-white rounded-lg shadow-sm border border-primary/10 relative h-32 w-32">
                  {selectedMethod?.qrCode && (
                    <img src={selectedMethod.qrCode} alt="QR" className="h-full w-full object-contain" />
                  )}
                </div>
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-muted rounded-xl p-3 border space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider">পেমেন্ট নির্দেশিকা (পড়ুন):</p>
              <div className="max-h-24 overflow-y-auto pr-1 space-y-1 text-[9px] leading-relaxed font-medium text-muted-foreground">
                <p>১. আপনার <strong>{selectedMethod?.label}</strong> অ্যাপে যান অথবা USSD ডায়াল করে <strong>"Send Money"</strong> অপশন সিলেক্ট করুন।</p>
                {selectedMethod?.id !== 'banglaQr' ? (
                  <p>২. উপরে দেওয়া <strong>Personal</strong> নম্বরটি কপি করে প্রাপক হিসেবে দিন।</p>
                ) : (
                  <p>২. উপরে দেওয়া <strong>Bangla QR</strong> কোডটি আপনার ব্যাংক বা পেমেন্ট অ্যাপ দিয়ে স্ক্যান করুন।</p>
                )}
                <p>৩. মোট পেমেন্ট অ্যামাউন্ট <strong>৳{totalPrice}</strong> সেন্ড মানি করুন।</p>
                <p>৪. সফলভাবে টাকা পাঠানোর পর নিচের ট্যাব থেকে <strong>মোবাইল নম্বর</strong> অথবা <strong>TrxID</strong> যেকোনো একটি তথ্য দিয়ে পেমেন্ট নিশ্চিত করুন।</p>
              </div>
            </div>

            {/* Selection Tabs */}
            <div className="flex border-b mt-2">
              <button
                type="button"
                onClick={() => setPaymentDetailTab('phone')}
                className={`flex-1 pb-1.5 text-[11px] font-bold text-center border-b-2 transition-all ${
                  paymentDetailTab === 'phone'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {selectedMethod?.label} নম্বর দিয়ে
              </button>
              <button
                type="button"
                onClick={() => setPaymentDetailTab('trx')}
                className={`flex-1 pb-1.5 text-[11px] font-bold text-center border-b-2 transition-all ${
                  paymentDetailTab === 'trx'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                ট্রানজেকশন আইডি (TrxID) দিয়ে
              </button>
            </div>

            {/* Verification Field */}
            <div className="space-y-3 pt-1">
              {paymentDetailTab === 'phone' ? (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">আপনার {selectedMethod?.label} নম্বর</Label>
                  <Input 
                    placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন (যেমন: 017XXXXXXXX)" 
                    value={manualDetails.senderNumber}
                    onChange={(e) => setManualDetails({...manualDetails, senderNumber: e.target.value})}
                    className="h-10 rounded-lg text-xs focus:ring-primary/20 bg-background"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">ট্রানজেকশন আইডি (TrxID)</Label>
                  <Input 
                    placeholder="যেমন: 8N7A6D5C" 
                    value={manualDetails.transactionId}
                    onChange={(e) => setManualDetails({...manualDetails, transactionId: e.target.value.toUpperCase()})}
                    className="h-10 rounded-lg text-xs focus:ring-primary/20 bg-background"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted border-t flex flex-row gap-3 shrink-0">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="rounded-full h-10 flex-1 font-bold text-xs bg-background">বাতিল করুন</Button>
            <Button 
              disabled={
                paymentDetailTab === 'phone'
                  ? !manualDetails.senderNumber.trim()
                  : !manualDetails.transactionId.trim()
              }
              onClick={() => {
                setShowPaymentModal(false);
                toast.success(`${selectedMethod?.label} details saved!`);
              }} 
              className="rounded-full h-10 flex-1 font-black uppercase tracking-widest text-xs shadow-md"
            >
              পেমেন্ট নিশ্চিত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
