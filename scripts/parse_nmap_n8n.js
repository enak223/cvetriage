const stdout = $input.first().json.stdout;

function extractAttr(tag, attr) {
  const match = tag.match(new RegExp(`${attr}="([^"]*)"`));
  return match ? match[1] : '';
}

const results = [];
const hostBlocks = stdout.match(/<host[\s\S]*?<\/host>/g) || [];

for (const hostBlock of hostBlocks) {
  if (!hostBlock.includes('state="up"')) continue;
  const addrMatch = hostBlock.match(/<address addr="([^"]+)" addrtype="ipv4"/);
  const ip = addrMatch ? addrMatch[1] : 'unknown';
  const hostnameMatch = hostBlock.match(/<hostname name="([^"]+)"/);
  const hostname = hostnameMatch ? hostnameMatch[1] : '';
  const portBlocks = hostBlock.match(/<port[\s\S]*?<\/port>/g) || [];
  for (const portBlock of portBlocks) {
    if (!portBlock.includes('state="open"')) continue;
    const protocol  = extractAttr(portBlock, 'protocol');
    const portid    = extractAttr(portBlock, 'portid');
    const service   = extractAttr(portBlock, 'name');
    const product   = extractAttr(portBlock, 'product');
    const version   = extractAttr(portBlock, 'version');
    const extrainfo = extractAttr(portBlock, 'extrainfo');
    const cpe       = (portBlock.match(/<cpe>(.*?)<\/cpe>/) || [])[1] || '';
    const nvdKeyword = [product, version].filter(Boolean).join(' ').trim() || service;
    if (!product && !version) continue;
    results.push({
      json: {
        ip, hostname, protocol,
        port: parseInt(portid, 10),
        service, product, version, extrainfo, cpe, nvdKeyword,
        serviceId: `${ip}:${portid}/${protocol}`,
        scannedAt: new Date().toISOString(),
      }
    });
  }
}

if (results.length === 0) {
  return [{ json: { status: 'no_open_ports', scannedAt: new Date().toISOString() } }];
}

return results;
