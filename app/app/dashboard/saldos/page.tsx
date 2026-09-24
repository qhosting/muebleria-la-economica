import { redirect } from 'next/navigation';

export default function SaldosRedirectPage() {
  redirect('/dashboard/clientes');
}
