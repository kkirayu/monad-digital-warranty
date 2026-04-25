import React, { useState, useRef } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { 
  ShieldCheck, PlusCircle, Wallet, CheckCircle2, 
  FileUp, ChevronRight, LogOut, Package, Loader2, Settings,
  Activity, Box, History
} from 'lucide-react';

// ==========================================
// 1. KONFIGURASI SMART CONTRACT & MONAD
// ==========================================
const CONTRACT_ADDRESS = "0xEd937600da7A74b71154f1F070A1953A64B37fa6";
const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";
const MONAD_CHAIN_ID = 10143; 

const monadTestnet = {
  id: MONAD_CHAIN_ID,
  network: 'monad-testnet',
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_RPC_URL] },
    public: { http: [MONAD_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com/' },
  },
};

const CONTRACT_ABI = [
  {"inputs":[{"internalType":"address","name":"defaultAdmin","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"customer","type":"address"},{"internalType":"string","name":"serialNumber","type":"string"},{"internalType":"uint256","name":"expiryDate","type":"uint256"}],"name":"WarrantyIssued","type":"event"},
  {"inputs":[],"name":"ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address[]","name":"customers","type":"address[]"},{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"uint256","name":"durationInDays","type":"uint256"},{"internalType":"string[]","name":"metadataURIs","type":"string[]"}],"name":"batchIssueWarranty","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"customer","type":"address"},{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"uint256","name":"durationInDays","type":"uint256"},{"internalType":"string","name":"metadataURI","type":"string"}],"name":"issueWarranty","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"productTypes","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"string","name":"productName","type":"string"}],"name":"registerProductType","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"warrantyDetails","outputs":[{"internalType":"string","name":"serialNumber","type":"string"},{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"uint256","name":"expiryDate","type":"uint256"},{"internalType":"bool","name":"isVoided","type":"bool"},{"internalType":"address","name":"issuer","type":"address"}],"stateMutability":"view","type":"function"}
];

// ==========================================
// 2. KOMPONEN UTAMA APLIKASI
// ==========================================
const WarrantyApp = () => {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets(); 
  
  const [view, setView] = useState<'home' | 'seller' | 'verify' | 'mint' | 'admin'>('home');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState("");

  const [productCatalog, setProductCatalog] = useState([
    { id: 101, name: "Lenovo LOQ A16" },
    { id: 102, name: "MacBook Air M2" },
    { id: 103, name: "Asus ROG Zephyrus" }
  ]);

  // STATE BARU: Untuk menyimpan riwayat transaksi di Dashboard
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [customerWallet, setCustomerWallet] = useState("");
  const [durationDays, setDurationDays] = useState("365"); 

  const [newProductName, setNewProductName] = useState("");
  const [newProductId, setNewProductId] = useState("");

  const [searchTokenId, setSearchTokenId] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSigner = async () => {
    const activeWallet = wallets[0]; 
    if (!activeWallet) throw new Error("Wallet tidak ditemukan. Tunggu proses pembuatan wallet oleh Privy.");
    
    if (activeWallet.chainId !== `eip155:${MONAD_CHAIN_ID}`) {
      await activeWallet.switchChain(MONAD_CHAIN_ID);
    }

    const provider = await activeWallet.getEthereumProvider();
    const ethersProvider = new ethers.BrowserProvider(provider);
    return await ethersProvider.getSigner();
  };

  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductId || !newProductName) return;
    try {
      setIsProcessing(true);
      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.registerProductType(newProductId, newProductName);
      
      await tx.wait(); 
      alert("Sukses! Produk berhasil didaftarkan On-Chain.");
      
      setProductCatalog(prev => [
        ...prev, 
        { id: parseInt(newProductId), name: newProductName }
      ]);

      setNewProductName(""); 
      setNewProductId("");
    } catch (error: any) {
      alert(`Gagal: ${error.reason || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMintOnChain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerWallet || !selectedProductId || !durationDays) return;
    try {
      setIsProcessing(true);
      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const durationInt = parseInt(durationDays);
      if (isNaN(durationInt) || durationInt <= 0) {
          alert("Durasi garansi harus berupa angka valid.");
          setIsProcessing(false);
          return;
      }

      const tx = await contract.issueWarranty(customerWallet, selectedProductId, durationInt, "ipfs://QmMockMetadataHash");
      await tx.wait();
      
      alert("Sukses! Garansi berhasil dicetak di jaringan Monad.");
      
      // MENAMBAHKAN DATA KE DASHBOARD
      const productName = productCatalog.find(p => p.id === parseInt(selectedProductId))?.name || "Unknown";
      setRecentTransactions(prev => [{
        hash: tx.hash,
        product: productName,
        wallet: customerWallet,
        date: new Date().toLocaleDateString('id-ID'),
        duration: durationInt
      }, ...prev]);

      setCustomerWallet("");
      setView('seller');
    } catch (error: any) {
      alert(`Gagal mencetak garansi: ${error.reason || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim() !== '');
      const customers: string[] = [];
      const productIds: number[] = [];
      const durations: number[] = [];
      const uris: string[] = [];

      rows.forEach(row => {
        const cols = row.split(',');
        if (cols.length >= 2) {
          customers.push(cols[0].trim());
          productIds.push(parseInt(cols[1].trim()));
          durations.push(cols[2] ? parseInt(cols[2].trim()) : 365);
          uris.push(cols[3] ? cols[3].trim() : "ipfs://mock");
        }
      });

      if (customers.length === 0) throw new Error("CSV kosong atau format salah");

      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.batchIssueWarranty(customers, productIds[0], durations[0], uris);
      await tx.wait();
      
      alert(`Batch Processing selesai! ${customers.length} garansi berhasil dicetak.`);
      
      // TAMBAHKAN LOG BATCH KE DASHBOARD
      setRecentTransactions(prev => [{
        hash: tx.hash,
        product: `Batch Issue (${customers.length} Items)`,
        wallet: "Multiple Addresses",
        date: new Date().toLocaleDateString('id-ID'),
        duration: durations[0]
      }, ...prev]);

      setView('seller');
    } catch (error: any) {
      alert(`Gagal batch mint: ${error.message}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVerifyOnChain = async () => {
    if (!searchTokenId) return;
    try {
      setIsProcessing(true);
      setSearchResult(null);
      const provider = new ethers.JsonRpcProvider(MONAD_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const details = await contract.warrantyDetails(searchTokenId);
      
      setSearchResult({
        sn: details.serialNumber,
        productId: details.productId.toString(),
        expiry: new Date(Number(details.expiryDate) * 1000).toLocaleDateString('id-ID'),
        isVoid: details.isVoided,
        issuer: details.issuer
      });
    } catch (error: any) {
      setSearchResult('not_found');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!ready) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-[#836EF9] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[#836EF9] text-xs font-black uppercase tracking-[0.4em]">Initializing Ecosystem...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-[#836EF9]/30">
      <nav className="border-b border-gray-900 bg-black/80 backdrop-blur-xl sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-[#836EF9] rounded-xl flex items-center justify-center shadow-lg shadow-[#836EF9]/40">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic text-white">Monad <span className="text-[#836EF9]">Warranty</span></span>
        </div>

        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          <button onClick={() => setView('home')} className={view === 'home' ? 'text-white' : ''}>Home</button>
          <button onClick={() => setView('verify')} className={view === 'verify' ? 'text-white' : ''}>Verify</button>
          {authenticated && <button onClick={() => setView('seller')} className={view === 'seller' ? 'text-white' : ''}>Dashboard</button>}
          {authenticated && <button onClick={() => setView('admin')} className={view === 'admin' ? 'text-white' : ''}><Settings className="w-4 h-4 text-white"/></button>}
        </div>

        <div className="flex items-center gap-3">
          {wallets.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase border border-green-500/50 text-green-500 bg-green-500/5 tracking-widest">
              <Wallet className="w-3 h-3" />
              {wallets[0].address.slice(0,6)}...{wallets[0].address.slice(-4)}
            </div>
          )}
          
          {!authenticated ? (
            <button onClick={login} className="bg-[#E1251B] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 hover:opacity-80 transition shadow-lg shadow-[#E1251B]/10">
              Login Privy
            </button>
          ) : (
            <button onClick={logout} className="p-2 text-gray-500 hover:text-red-500 transition"><LogOut className="w-4 h-4" /></button>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 min-h-[75vh]">
        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="py-20 text-center space-y-12 animate-in fade-in duration-700">
            <div className="space-y-6">
              <div className="inline-block bg-[#836EF9]/10 border border-[#836EF9]/20 px-4 py-1 rounded-full text-[#836EF9] text-[10px] font-black uppercase tracking-[0.3em]">Monad x Privy Ecosystem</div>
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none text-white">IDENTITY <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#836EF9] to-[#E1251B]">SECURED.</span></h1>
              <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">Platform penerbitan garansi NFT otomatis untuk UMKM. Terintegrasi On-Chain di Monad Testnet.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => authenticated ? setView('seller') : login()} className="bg-[#836EF9] px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-[#836EF9]/20 text-white">Dashboard UMKM</button>
              <button onClick={() => setView('verify')} className="bg-gray-900 border border-gray-800 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors text-white">Cek Status Barang</button>
            </div>
          </div>
        )}

        {/* VIEW: ADMIN */}
        {view === 'admin' && (
          <div className="max-w-lg mx-auto space-y-8">
             <button onClick={() => setView('seller')} className="text-gray-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"><ChevronRight className="w-4 h-4 rotate-180" /> Kembali</button>
            <h2 className="text-3xl font-bold italic uppercase tracking-tighter text-white">Registrasi SKU Baru</h2>
            <div className="bg-[#0D0D12] border border-gray-800 p-8 rounded-[32px] space-y-6 shadow-2xl">
              <form onSubmit={handleRegisterProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ID Produk (Angka Bebas)</label>
                  <input type="number" required placeholder="Contoh: 104" className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#836EF9]" value={newProductId} onChange={(e) => setNewProductId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nama Barang Resmi</label>
                  <input type="text" required placeholder="Contoh: Asus Zenbook 14" className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#836EF9]" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                </div>
                <button disabled={isProcessing} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : "Daftarkan di Monad"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: MINT FORM */}
        {view === 'mint' && (
          <div className="max-w-lg mx-auto space-y-8">
             <button onClick={() => setView('seller')} className="text-gray-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"><ChevronRight className="w-4 h-4 rotate-180" /> Kembali</button>
            <h2 className="text-3xl font-bold italic uppercase tracking-tighter text-center text-white">Terbitkan Garansi</h2>
            <div className="bg-[#0D0D12] border border-gray-800 p-8 rounded-[32px] space-y-6 shadow-2xl">
              <form onSubmit={handleMintOnChain} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Pilih Katalog Produk</label>
                  <select required className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#836EF9] text-sm text-white" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                    <option value="">-- Pastikan ID sudah di-register via Admin --</option>
                    {productCatalog.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Wallet Pelanggan / Pembeli</label>
                  <input required type="text" placeholder="0x... (Ketik manual wallet pembeli)" className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#836EF9] text-sm font-mono text-white" value={customerWallet} onChange={(e) => setCustomerWallet(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Masa Aktif Garansi (Hari)</label>
                  <input required type="number" min="1" placeholder="Contoh: 365" className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#836EF9] text-sm font-mono text-white" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
                </div>
                
                <button disabled={isProcessing || wallets.length === 0} className="w-full bg-[#836EF9] py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#836EF9]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-white">
                  {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin"/> Processing On-Chain...</> : "Konfirmasi Transaksi"}
                </button>
                {wallets.length === 0 && <p className="text-[9px] text-red-500 font-bold uppercase text-center tracking-tighter italic">Sistem sedang memuat Wallet milikmu, harap tunggu sejenak.</p>}
              </form>
            </div>
          </div>
        )}

        {/* VIEW: VERIFY */}
        {view === 'verify' && (
          <div className="max-w-2xl mx-auto space-y-12 py-10">
            <div className="text-center space-y-4 text-white">
              <h2 className="text-5xl font-black tracking-tighter uppercase italic">Cek Garansi</h2>
              <p className="text-gray-500">Validasi keaslian produk dan identitas penjual langsung dari blockchain.</p>
            </div>

            <div className="flex gap-3">
              <input type="number" placeholder="Masukkan Token ID (Angka)" className="flex-1 bg-black border border-white/10 rounded-2xl py-5 px-6 outline-none focus:border-[#836EF9] text-lg font-mono text-white" value={searchTokenId} onChange={(e) => setSearchTokenId(e.target.value)} />
              <button onClick={handleVerifyOnChain} className="bg-[#836EF9] px-10 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#836EF9]/20 transition-all hover:bg-[#7056e3] text-white">
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5"/> : "Verify"}
              </button>
            </div>

            {searchResult && searchResult !== 'not_found' && (
              <div className="bg-[#0D0D12] border border-green-500/30 p-10 rounded-[40px] shadow-2xl space-y-10">
                <div className="flex items-center gap-4 text-green-500">
                  <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center"><CheckCircle2 className="w-8 h-8" /></div>
                  <div>
                    <h4 className="text-2xl font-bold tracking-tight">Authentic Product</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">Digital Asset Verified on Monad</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-10 border-t border-white/5 pt-10 text-white">
                  <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Generated SN</p><p className="font-mono text-sm text-[#836EF9] font-bold">{searchResult.sn}</p></div>
                  <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Mapping SKU</p><p className="font-bold text-xl">{searchResult.productId}</p></div>
                  <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Valid Until</p><p className="font-bold text-xl">{searchResult.expiry}</p></div>
                  <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Contract Status</p><p className="text-green-500 font-bold uppercase text-xl">{searchResult.isVoid ? 'VOID' : 'ACTIVE'}</p></div>
                  <div className="col-span-2"><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Issuer Wallet</p><p className="font-mono text-xs text-gray-400">{searchResult.issuer}</p></div>
                </div>
              </div>
            )}
             {searchResult === 'not_found' && (
              <div className="bg-[#0D0D12] border border-red-500/30 p-10 rounded-[40px] text-center text-red-500 font-bold">Token ID Tidak Ditemukan atau Error saat mengambil data dari Monad.</div>
             )}
          </div>
        )}

        {/* VIEW: SELLER DASHBOARD (BARU DI-UPDATE!) */}
        {view === 'seller' && (
           <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 text-white">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white uppercase italic">Portal UMKM</h2>
                <p className="text-gray-500 text-sm italic">Privy ID: <span className="text-[#836EF9] font-bold">{user?.id?.replace('did:privy:', '')}</span></p>
              </div>
              <div className="flex gap-3">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCSVUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="bg-gray-900 border border-gray-800 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-2 text-white">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileUp className="w-4 h-4" />} CSV Batch
                </button>
                <button onClick={() => setView('mint')} className="bg-[#836EF9] px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#7056e3] transition-colors shadow-lg shadow-[#836EF9]/20 text-white">
                  <PlusCircle className="w-4 h-4" /> Issue Warranty
                </button>
              </div>
            </div>

            {/* KARTU STATISTIK */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0D0D12] border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                 <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Total SKU (Produk)</p>
                    <p className="text-3xl font-black text-white mt-2">{productCatalog.length}</p>
                 </div>
                 <Box className="w-10 h-10 text-gray-800" />
              </div>
              <div className="bg-[#0D0D12] border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                 <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Garansi Diterbitkan</p>
                    <p className="text-3xl font-black text-[#836EF9] mt-2">{recentTransactions.length}</p>
                 </div>
                 <Activity className="w-10 h-10 text-[#836EF9]/20" />
              </div>
              <div className="bg-[#0D0D12] border border-green-500/20 p-6 rounded-2xl flex items-center justify-between">
                 <div>
                    <p className="text-green-500 text-[10px] uppercase tracking-widest font-bold">Status Jaringan</p>
                    <p className="text-xl font-bold text-white mt-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                      Monad Active
                    </p>
                 </div>
              </div>
            </div>

            {/* TABEL RIWAYAT TRANSAKSI */}
            <div className="bg-[#0D0D12] border border-gray-900 rounded-[32px] overflow-hidden">
               <div className="p-8 border-b border-gray-900 flex items-center gap-3">
                 <History className="w-5 h-5 text-gray-500" />
                 <h3 className="text-lg font-bold text-white">Riwayat Cetak Garansi</h3>
               </div>
               
               {recentTransactions.length === 0 ? (
                 <div className="p-20 text-center space-y-4">
                    <Package className="w-12 h-12 text-gray-800 mx-auto" />
                    <p className="text-gray-600 text-xs italic">Belum ada garansi yang dicetak di sesi ini.</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-gray-400">
                     <thead className="text-[10px] uppercase tracking-widest font-black text-gray-600 bg-black/50">
                       <tr>
                         <th className="px-8 py-5">Produk</th>
                         <th className="px-8 py-5">Wallet Pelanggan</th>
                         <th className="px-8 py-5">Durasi</th>
                         <th className="px-8 py-5">Tanggal</th>
                         <th className="px-8 py-5">Bukti (Tx)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-900">
                       {recentTransactions.map((tx, idx) => (
                         <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                           <td className="px-8 py-5 font-bold text-white">{tx.product}</td>
                           <td className="px-8 py-5 font-mono text-xs">{tx.wallet.slice(0,6)}...{tx.wallet.slice(-4)}</td>
                           <td className="px-8 py-5 text-green-500">{tx.duration} Hari</td>
                           <td className="px-8 py-5">{tx.date}</td>
                           <td className="px-8 py-5">
                             <a href={`https://testnet.monadexplorer.com/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-[#836EF9] hover:text-white font-mono text-[10px] bg-[#836EF9]/10 px-3 py-1 rounded-full inline-block">
                               {tx.hash.slice(0,8)}...
                             </a>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-900 py-16 text-center">
        <p className="text-gray-700 text-[9px] font-black uppercase tracking-[0.5em]">Connected to Monad RPC Node v1.0 • Privy MSME On-Chain Solution</p>
      </footer>
    </div>
  );
};

// ==========================================
// 3. PEMBUNGKUS UTAMA (APP)
// ==========================================
export default function App() {
  return (
    <PrivyProvider
      appId="cmoe1rgae02ja0clb31f0ry9q" // <-- JANGAN LUPA GANTI INI
      config={{
        loginMethods: ['email', 'wallet', 'google'], 
        defaultChain: monadTestnet, 
        supportedChains: [monadTestnet],
        appearance: {
          theme: 'dark',
          accentColor: '#836EF9',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <WarrantyApp />
    </PrivyProvider>
  );
}