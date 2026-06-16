import paymentBankCard from '../../assets/ui-kit/payment-bank-card.svg';
import paymentMirPay from '../../assets/ui-kit/payment-mir-pay.svg';
import paymentSbp from '../../assets/ui-kit/payment-sbp.svg';

export type PaymentMethodType = 'bankCard' | 'linkedBankCard' | 'mirPay' | 'sbp';

type PaymentMethodIconProps = {
  type: PaymentMethodType | null | undefined;
  className?: string;
};

const PAYMENT_METHOD_ICONS: Record<PaymentMethodType, string> = {
  bankCard: paymentBankCard,
  linkedBankCard: paymentBankCard,
  mirPay: paymentMirPay,
  sbp: paymentSbp,
};

const getPaymentMethodIcon = (type: PaymentMethodType | null | undefined) => (type ? PAYMENT_METHOD_ICONS[type] : undefined) ?? paymentBankCard;

export const PaymentMethodIcon = ({ className = '', type }: PaymentMethodIconProps) => (
  <img alt="" aria-hidden="true" className={className} src={getPaymentMethodIcon(type)} />
);
