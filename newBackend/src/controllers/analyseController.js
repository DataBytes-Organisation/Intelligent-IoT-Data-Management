exports.analyse = (req, res) => {
  // You’ll see this in the terminal
  console.log('Analyse payload:', req.body);

  // Echo back for now (swap in real logic later)
  res.json({ ok: true, received: req.body });
};
