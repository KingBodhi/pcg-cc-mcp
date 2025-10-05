import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Copy,
  Eye,
  EyeOff,
  Coins,
  TrendingUp,
  TrendingDown,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useUserSystem } from '@/components/config-provider';
import { formatDistanceToNow } from 'date-fns';

interface WalletTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  context: string;
}

export function WalletSettings() {
  const { t } = useTranslation('settings');
  const { config } = useUserSystem();
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const wallet = config?.aptos_wallet;

  const transactions: WalletTransaction[] = useMemo(
    () => [
      {
        id: 'txn_24a8',
        description: 'Claude 3.5 Sonnet - code generation',
        context: 'Task #1824',
        amount: 18.5,
        type: 'debit',
        timestamp: '2025-09-30T21:12:00Z',
        status: 'completed',
      },
      {
        id: 'txn_24a7',
        description: 'Gemini Flash 2.1 - design review',
        context: 'Session with design team',
        amount: 9.25,
        type: 'debit',
        timestamp: '2025-09-30T18:45:00Z',
        status: 'completed',
      },
      {
        id: 'txn_24a6',
        description: 'Budget top-up',
        context: 'Ops budget allocation',
        amount: 200,
        type: 'credit',
        timestamp: '2025-09-30T16:00:00Z',
        status: 'completed',
      },
    ],
    []
  );

  const initialBudget = 250;

  const summary = useMemo(() => {
    const totals = transactions.reduce(
      (acc, txn) => {
        if (txn.type === 'credit') {
          acc.credits += txn.amount;
        } else {
          acc.debits += txn.amount;
        }
        return acc;
      },
      { credits: 0, debits: 0 }
    );

    const available = initialBudget + totals.credits - totals.debits;
    const utilisation = Math.min(
      Math.max((totals.debits / (initialBudget + totals.credits || 1)) * 100, 0),
      100
    );

    return {
      available: Number(available.toFixed(2)),
      credits: Number(totals.credits.toFixed(2)),
      debits: Number(totals.debits.toFixed(2)),
      utilisation,
    };
  }, [transactions]);

  const handleCopy = useCallback(async (label: string, value: string) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy value', error);
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  }, []);

  const formatAmount = (amount: number, sign: 'auto' | 'positive' = 'auto') => {
    const prefix = sign === 'positive' ? '+' : amount < 0 && sign === 'auto' ? '-' : '';
    const absolute = Math.abs(amount).toFixed(2);
    return `${prefix}${absolute} ꜩ`;
  };

  const renderStatusBadge = (status: WalletTransaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary">{t('wallet.activity.status.completed', { defaultValue: 'Completed' })}</Badge>;
      case 'pending':
        return <Badge variant="outline">{t('wallet.activity.status.pending', { defaultValue: 'Pending' })}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('wallet.activity.status.failed', { defaultValue: 'Failed' })}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {t('wallet.title', { defaultValue: 'Team Wallet' })}
          </CardTitle>
          <CardDescription>
            {t('wallet.description', {
              defaultValue:
                'Track token balances and spending for access to paid model capabilities across the network.',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t('wallet.summary.available', { defaultValue: 'Available balance' })}</span>
                <Coins className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatAmount(summary.available, 'positive')}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t('wallet.summary.allocated', { defaultValue: 'Allocated budget' })}</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatAmount(initialBudget + summary.credits, 'positive')}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('wallet.summary.credits', {
                  defaultValue: '+{{amount}} ꜩ credited this period',
                  amount: summary.credits.toFixed(2),
                })}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t('wallet.summary.spent', { defaultValue: 'Spent this period' })}</span>
                <TrendingDown className="h-4 w-4" />
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatAmount(summary.debits)}
              </div>
              <Progress value={summary.utilisation} className="mt-3" />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('wallet.summary.utilisation', {
                  defaultValue: '{{percent}}% of available budget used',
                  percent: summary.utilisation.toFixed(0),
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            {t('wallet.details.title', { defaultValue: 'Wallet details' })}
          </CardTitle>
          <CardDescription>
            {t('wallet.details.description', {
              defaultValue:
                'Share your account address with collaborators or route pre-approved budgets to accounts that need them.',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!wallet ? (
            <Alert variant="destructive">
              <AlertDescription>
                {t('wallet.details.missing', {
                  defaultValue: 'Unable to load wallet metadata. Restart the dashboard to provision a fresh wallet.',
                })}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wallet-account">
                  {t('wallet.details.account', { defaultValue: 'Account address' })}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet-account"
                    value={wallet.account_address}
                    readOnly
                    className="font-mono"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleCopy(
                        t('wallet.details.account', { defaultValue: 'Account address' }),
                        wallet.account_address
                      )
                    }
                    aria-label={t('wallet.details.copyAccount', { defaultValue: 'Copy account address' })}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-public">
                  {t('wallet.details.publicKey', { defaultValue: 'Public key' })}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet-public"
                    value={wallet.public_key}
                    readOnly
                    className="font-mono"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleCopy(
                        t('wallet.details.publicKey', { defaultValue: 'Public key' }),
                        wallet.public_key
                      )
                    }
                    aria-label={t('wallet.details.copyPublicKey', { defaultValue: 'Copy public key' })}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="wallet-private">
                  {t('wallet.details.privateKey', { defaultValue: 'Private key' })}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet-private"
                    type={showPrivateKey ? 'text' : 'password'}
                    value={wallet.private_key}
                    readOnly
                    className="font-mono"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPrivateKey((prev) => !prev)}
                    aria-label={
                      showPrivateKey
                        ? t('wallet.details.hidePrivateKey', { defaultValue: 'Hide private key' })
                        : t('wallet.details.showPrivateKey', { defaultValue: 'Show private key' })
                    }
                  >
                    {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleCopy(
                        t('wallet.details.privateKey', { defaultValue: 'Private key' }),
                        wallet.private_key
                      )
                    }
                    aria-label={t('wallet.details.copyPrivateKey', { defaultValue: 'Copy private key' })}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('wallet.details.privateKeyHint', {
                    defaultValue:
                      'Keep this key confidential. Anyone with access can spend your allocated tokens.',
                  })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('wallet.activity.title', { defaultValue: 'Recent activity' })}</CardTitle>
          <CardDescription>
            {t('wallet.activity.description', {
              defaultValue:
                'Usage history helps finance and operations teams understand how model credits are spent.',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <Alert>
              <AlertDescription>
                {t('wallet.activity.empty', {
                  defaultValue: 'No wallet activity yet. Model spending and top-ups will appear here.',
                })}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('wallet.activity.table.time', { defaultValue: 'When' })}</TableHead>
                    <TableHead>{t('wallet.activity.table.description', { defaultValue: 'Description' })}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t('wallet.activity.table.context', { defaultValue: 'Context' })}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('wallet.activity.table.amount', { defaultValue: 'Amount' })}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('wallet.activity.table.status', { defaultValue: 'Status' })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDistanceToNow(new Date(txn.timestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="font-medium">{txn.description}</div>
                        <div className="text-xs text-muted-foreground">{txn.id}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {txn.context}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span
                          className={txn.type === 'debit' ? 'text-red-500' : 'text-emerald-500'}
                        >
                          {txn.type === 'debit' ? '-' : '+'}
                          {txn.amount.toFixed(2)} ꜩ
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {renderStatusBadge(txn.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
