package store

import (
	"go_tsconditioner/internal/timeseries"
	"sync"
)

type TsStore struct {
	mu   sync.RWMutex
	data map[uint64]*timeseries.TimeSeries
}

var GlobalTsStore = &TsStore{
	data: make(map[uint64]*timeseries.TimeSeries),
}

func (s *TsStore) Save(ts *timeseries.TimeSeries) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[ts.MemId] = ts
}

func (s *TsStore) Get(id uint64) (*timeseries.TimeSeries, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	ts, ok := s.data[id]
	return ts, ok
}
